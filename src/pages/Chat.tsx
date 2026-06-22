import { useState, useRef, useEffect, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { loadSymptoms, idToName, chiefComplaintNames, type ChatMessage } from "@/data/symptoms";
import { api, type BatchQuestion } from "@/services/api";
import { LikertBatchForm } from "@/components/LikertBatchForm";
import { VariantSelectForm } from "@/components/VariantSelectForm";
import { SymptomAutocomplete } from "@/components/SymptomAutocomplete";
import { toDisplayName, getCurrentLanguage } from "@/i18n/symptomLang";
import { X, Send, Stethoscope } from "lucide-react";
import { motion } from "framer-motion";

/** Convert symptom IDs to comma-separated lowercase names for the API */
const idsToApiString = (ids: string[], symptomList: string[]): string =>
  ids.map((id) => idToName(id, symptomList).toLowerCase()).join(", ");

const Chat = () => {
  const { t } = useTranslation();
  const location = useLocation();
  const navState = location.state as { symptom?: string; sex?: string; age?: string; duration?: string; chatMessages?: ChatMessage[]; cachedPrediction?: unknown; confirmedSymptoms?: string[]; symptoms?: string; severity?: string; symptomLabel?: string } | null;
  const symptomParam  = navState?.symptom   || "headache";
  const sexParam      = navState?.sex       || "";
  const ageParam      = navState?.age       || "25";
  const durationParam = navState?.duration  || "1";

  const [symptomList, setSymptomList] = useState<string[]>([]);

  useEffect(() => {
    loadSymptoms().then(setSymptomList);
  }, []);

  const symptomIds = symptomParam.split(",").map((s) => s.trim());
  const symptomNames = symptomIds.map((id) => idToName(id, symptomList));
  const displayNames = symptomNames.map((n) => toDisplayName(n));
  const symptomLabel =
    displayNames.length === 1
      ? displayNames[0]
      : displayNames.slice(0, -1).join(", ") + ` ${t("and")} ` + displayNames[displayNames.length - 1];

  const navigate = useNavigate();

  const restoredMessages = navState?.chatMessages;

  const [messages, setMessages]   = useState<ChatMessage[]>(restoredMessages || []);
  const messagesRef = useRef(messages);
  messagesRef.current = messages;
  const [input, setInput]         = useState("");
  const [isTyping, setIsTyping]   = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // ── Core conversation state ────────────────────────────────────────────────
  const [severity, setSeverity]                   = useState<string | null>(restoredMessages ? "restored" : null);
  const [confirmed, setConfirmed]                 = useState<string[]>([]);
  const [rejected, setRejected]                   = useState<string[]>([]);
  const [unsure, setUnsure]                       = useState<string[]>([]);
  const [questionCount, setQuestionCount]         = useState(0);
  const [conversationDone, setConversationDone]   = useState(!!restoredMessages);
  const [currentSymptomKey, setCurrentSymptomKey] = useState<string | null>(null);

  // ── Additional symptoms state ──────────────────────────────────────────────
  // awaitingAdditionalSymptoms: pool drained the first time — bot has asked
  //   "any other symptoms?", input is re-enabled for the patient to type extras.
  //
  // extraSeeds: the patient-volunteered extras, stored persistently in state.
  //   CRITICAL — these must be passed on EVERY API call in the second round.
  //   Because the backend is stateless it reconstructs the full pool from
  //   scratch on each request. Without extraSeeds in every call the backend
  //   won't know about them and won't call add_seed() for them, producing
  //   wrong/repeated questions. This mirrors ques_sugg.py lines 799-814:
  //     for sym in new_symptoms:
  //         if sym in all_symptoms:
  //             pool.add_seed(sym)   ← seed, not add_symptom
  //     run_interview(pool)          ← same pool object reused; we replicate
  //                                    this by always sending extraSeeds.
  const [awaitingAdditionalSymptoms, setAwaitingAdditionalSymptoms] = useState(false);
  const [extraSeeds, setExtraSeeds]               = useState<string[]>([]);
  const [poolQuestionsAsked, setPoolQuestionsAsked] = useState(0);
  const [pendingVariantOptions, setPendingVariantOptions] = useState<string[] | null>(null);
  const [activeVariantMsgId, setActiveVariantMsgId] = useState<string | null>(null);

  // ── Batch (Likert) mode state ─────────────────────────────────────────────
  const [pendingBatch, setPendingBatch]       = useState<BatchQuestion[] | null>(null);
  const [batchAnswers, setBatchAnswers]       = useState<Record<string, "yes" | "no" | "unsure">>({});
  const [batchLoading, setBatchLoading]       = useState(false);
  const [activeBatchMsgId, setActiveBatchMsgId] = useState<string | null>(null);

  // Derived: true once the patient has entered extras and second round started.
  const inSecondRound = extraSeeds.length > 0;

  const progress = severity === null ? 10 : conversationDone ? 100 : Math.min(20 + questionCount * 15, 90);

  const addMessage = useCallback((msg: ChatMessage) => {
    setMessages((prev) => [...prev, msg]);
  }, []);

  const addMessages = useCallback((msgs: ChatMessage[]) => {
    setMessages((prev) => [...prev, ...msgs]);
  }, []);

  // ── Navigate to results ────────────────────────────────────────────────────
  const navigateToResults = useCallback(
    (finalConfirmed: string[]) => {
      const allSymptoms = [
        ...symptomIds.map((id) => idToName(id, symptomList).toLowerCase()),
        ...finalConfirmed,
      ].join(", ");

      navigate("/results", {
        state: {
          symptoms:          allSymptoms,
          age:               parseInt(ageParam),
          gender:            sexParam === "male" ? "Male" : "Female",
          severity:          severity || "Mild",
          duration:          parseInt(durationParam),
          symptomLabel,
          confirmedSymptoms: finalConfirmed,
          chatMessages:      messagesRef.current,
          chatParams: {
            symptom:  symptomParam,
            sex:      sexParam,
            age:      ageParam,
            duration: durationParam,
          },
        },
      });
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [symptomIds, ageParam, sexParam, durationParam, severity, symptomLabel, navigate, symptomParam]
  );

  // Initial greeting
  useEffect(() => {
    if (restoredMessages) return;
    setIsTyping(true);
    const timer = setTimeout(() => {
      addMessages([
        {
          id:     "1",
          sender: "bot",
          text:   t("greeting", { symptoms: symptomLabel }),
        },
        {
          id:           "2",
          sender:       "bot",
          text:         t("severity_question"),
          quickReplies: [t("severity_mild"), t("severity_moderate"), t("severity_severe")],
        },
      ]);
      setIsTyping(false);
    }, 800);
    return () => clearTimeout(timer);
  }, [symptomLabel, addMessages, restoredMessages]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, isTyping]);

  // ── fetchNextQuestion ──────────────────────────────────────────────────────
  /**
   * Calls /suggest-questions and handles the response.
   * Mirrors the ques_sugg.py run_interview loop, stateless per-call.
   *
   * @param newConfirmed    Full confirmed list so far.
   * @param newRejected     Full rejected list so far.
   * @param newUnsure       Full unsure list so far.
   * @param currentExtras   The extras the patient volunteered after the pool
   *                        first drained. Passed on every call in the second
   *                        round — backend adds them as seeds via add_seed().
   * @param isSecondRound   True during the second round. If pool drains again
   *                        we go to results instead of asking for extras again.
   */
  const fetchNextQuestion = useCallback(
    async (
      newConfirmed:  string[],
      newRejected:   string[],
      newUnsure:     string[],
      currentExtras: string[] = [],
      isSecondRound: boolean  = false,
      useBatch:      boolean  = false,
      expectVariants: boolean = false,
      batchConfirmedNames: string[] = [],
    ) => {
      if (useBatch && !expectVariants) {
        setBatchLoading(true);
      } else {
        setIsTyping(true);
      }
      try {
        const genderApi = sexParam === "male" ? "Male" : sexParam === "female" ? "Female" : "";

        const result = await api.suggestQuestions({
          symptoms:            idsToApiString(symptomIds, symptomList),
          age:                 parseInt(ageParam),
          confirmed:           newConfirmed,
          rejected:            newRejected,
          unsure:              newUnsure,
          gender:              genderApi,
          additional_symptoms: currentExtras,
          batch_size:          useBatch ? 5 : 1,
          questions_asked:     poolQuestionsAsked,
          language:            getCurrentLanguage(),
        });

        // ── Transitional message after batch submit (only when more questions follow) ──
        const hasMoreQuestions =
          (result.options && result.options.length > 0) ||
          (useBatch && result.batch && result.batch.length > 0) ||
          (result.next_question && result.question_text);

        if (batchConfirmedNames.length > 0 && hasMoreQuestions) {
          const names = batchConfirmedNames.map((s) => toDisplayName(s).replace(/\b\w/g, (c) => c.toUpperCase())).join(", ");
          const keys = ["batch_ack_confirmed_1", "batch_ack_confirmed_2", "batch_ack_confirmed_3", "batch_ack_confirmed_4", "batch_ack_confirmed_5"];
          addMessage({
            id: `batch-ack-${Date.now()}`,
            sender: "bot",
            text: t(keys[Math.floor(Math.random() * keys.length)], { names }),
          });
        } else if (batchConfirmedNames.length === 0 && hasMoreQuestions && useBatch) {
          const keys = ["batch_ack_none_1", "batch_ack_none_2", "batch_ack_none_3", "batch_ack_none_4", "batch_ack_none_5"];
          addMessage({
            id: `batch-ack-${Date.now()}`,
            sender: "bot",
            text: t(keys[Math.floor(Math.random() * keys.length)]),
          });
        }

        // ── Variant question (multi-select) ─────────────────────────
        if (result.options && result.options.length > 0) {
          const msgId = `variant-${Date.now()}`;
          setPendingVariantOptions(result.options);
          setActiveVariantMsgId(msgId);
          setQuestionCount((c) => c + 1);
          addMessage({
            id:               msgId,
            sender:           "bot",
            text:             result.question_text || t("select_all_apply"),
            variantOptions:   result.options,
            variantQuestionText: result.question_text || t("select_all_apply"),
          });
        }
        // ── Batch response ─────────────────────────────────────────────
        else if (useBatch && result.batch && result.batch.length > 0) {
          const msgId = `batch-${Date.now()}`;
          setPendingBatch(result.batch);
          setBatchAnswers({});
          setActiveBatchMsgId(msgId);
          setQuestionCount((c) => c + result.batch!.length);
          setPoolQuestionsAsked((c) => c + result.batch!.length);
          addMessage({
            id:             msgId,
            sender:         "bot",
            text:           t("please_answer"),
            batchQuestions:  result.batch,
          });
        }
        // ── Single question response ───────────────────────────────────
        else if (result.next_question && result.question_text) {
          setCurrentSymptomKey(result.next_question);
          setPendingVariantOptions(null);
          setQuestionCount((c) => c + 1);
          setPoolQuestionsAsked((c) => c + 1);
          addMessage({
            id:           `q-${Date.now()}`,
            sender:       "bot",
            text:         result.question_text,
            quickReplies: [t("yes"), t("no"), t("not_sure")],
          });
        }
        // ── Pool drained ───────────────────────────────────────────────
        else {
          setCurrentSymptomKey(null);

          if (!isSecondRound && result.has_severe_flag && result.matched_severe_symptoms.length > 0) {
            addMessage({
              id:     `severe-${Date.now()}`,
              sender: "bot",
              text:   `⚠️ ${t("severe_warning", { symptoms: result.matched_severe_symptoms.map((s: string) => toDisplayName(s)).join(", ") })}`,
            });
          }

          if (!isSecondRound) {
            setAwaitingAdditionalSymptoms(true);
            addMessage({
              id:           `extra-prompt-${Date.now()}`,
              sender:       "bot",
              text:         t("additional_symptoms_prompt"),
            });
          } else {
            setConversationDone(true);
            addMessage({
              id:     "done",
              sender: "bot",
              text:   t("done_message"),
            });
            setTimeout(() => navigateToResults(newConfirmed), 2000);
          }
        }
      } catch (error) {
        console.error("suggest-questions error:", error);
        setConversationDone(true);
        setAwaitingAdditionalSymptoms(false);
        addMessage({
          id:     "error",
          sender: "bot",
          text:   t("error_message"),
        });
        setTimeout(() => navigateToResults(newConfirmed), 2000);
      } finally {
        setIsTyping(false);
        setBatchLoading(false);
      }
    },
    [symptomIds, sexParam, ageParam, addMessage, navigateToResults, symptomList, poolQuestionsAsked]
  );

  // ── handleBatchSubmit ───────────────────────────────────────────────────────
  const handleBatchSubmit = useCallback(() => {
    if (!pendingBatch || pendingBatch.some((q) => batchAnswers[q.symptom] === undefined)) return;

    // Save answers into the batch message so selections stay visible after submit
    const batchMsgId = activeBatchMsgId;
    if (batchMsgId) {
      setMessages((prev) =>
        prev.map((m) =>
          m.id === batchMsgId ? { ...m, savedBatchAnswers: { ...batchAnswers } } : m
        )
      );
    }

    let newConfirmed = [...confirmed];
    let newRejected  = [...rejected];
    let newUnsure    = [...unsure];

    const confirmedNames: string[] = [];
    for (const q of pendingBatch) {
      const a = batchAnswers[q.symptom];
      if (a === "yes") {
        newConfirmed.push(q.symptom);
        confirmedNames.push(q.symptom);
      } else if (a === "no") {
        newRejected.push(q.symptom);
      } else {
        newUnsure.push(q.symptom);
      }
    }

    setConfirmed(newConfirmed);
    setRejected(newRejected);
    setUnsure(newUnsure);
    setPendingBatch(null);
    setBatchAnswers({});
    setActiveBatchMsgId(null);

    // Any confirmed symptom may have variants — backend will return variant
    // forms before the next batch. Use typing indicator (not batch skeleton)
    // since we don't know what the response will be.
    const hasConfirmedInBatch = confirmedNames.length > 0;
    fetchNextQuestion(newConfirmed, newRejected, newUnsure, extraSeeds, inSecondRound, true, hasConfirmedInBatch, confirmedNames);
  }, [pendingBatch, batchAnswers, activeBatchMsgId, confirmed, rejected, unsure, extraSeeds, inSecondRound, fetchNextQuestion, addMessage]);

  // ── handleVariantSubmit ───────────────────────────────────────────────────
  const handleVariantSubmit = useCallback((selected: string[]) => {
    if (!pendingVariantOptions) return;

    const selectedSet = new Set(selected);
    const label = selected.length === 0
      ? t("none_of_above")
      : selected.map((s) => toDisplayName(s).replace(/\b\w/g, (c) => c.toUpperCase())).join(", ");

    // Save selections into the variant message so history shows them
    const variantMsgId = activeVariantMsgId;
    if (variantMsgId) {
      setMessages((prev) =>
        prev.map((m) =>
          m.id === variantMsgId ? { ...m, savedVariantSelections: [...selected] } : m
        )
      );
    }

    addMessage({ id: `variant-ans-${Date.now()}`, sender: "user", text: label });

    let newConfirmed = [...confirmed];
    let newRejected  = [...rejected];

    for (const opt of pendingVariantOptions) {
      if (selectedSet.has(opt)) {
        newConfirmed.push(opt);
      } else {
        newRejected.push(opt);
      }
    }

    setConfirmed(newConfirmed);
    setRejected(newRejected);
    setPendingVariantOptions(null);
    setActiveVariantMsgId(null);

    // More variant forms may follow (e.g., cough variants then back pain variants),
    // so use typing indicator instead of batch skeleton.
    fetchNextQuestion(newConfirmed, newRejected, unsure, extraSeeds, inSecondRound, true, true);
  }, [pendingVariantOptions, confirmed, rejected, unsure, extraSeeds, inSecondRound, fetchNextQuestion, addMessage]);

  // ── handleUserReply ────────────────────────────────────────────────────────
  const handleUserReply = (text: string) => {
    const userMsg: ChatMessage = { id: `u-${Date.now()}`, sender: "user", text };
    addMessage(userMsg);

    // ── Stage 0: Severity selection ────────────────────────────────────────
    if (!severity) {
      const severityMap: Record<string, string> = {
        [t("severity_mild")]: "Mild",
        [t("severity_moderate")]: "Moderate",
        [t("severity_severe")]: "Severe",
      };
      const mapped = severityMap[text.trim()];
      if (mapped) {
        setSeverity(mapped);
        fetchNextQuestion([], [], []);
      }
      return;
    }

    // ── Stage 1: Additional symptoms entry ────────────────────────────────
    // Mirrors ques_sugg.py exit prompt (lines 793-814):
    // user enters comma-separated extras → each valid one becomes a new seed.
    if (awaitingAdditionalSymptoms) {
      setAwaitingAdditionalSymptoms(false);
      const trimmed = text.trim().toLowerCase();

      const isNegative =
        trimmed === "no other symptoms" ||
        trimmed === "no" ||
        trimmed === "none" ||
        trimmed === "";

      if (isNegative) {
        setConversationDone(true);
        addMessage({
          id:     "done",
          sender: "bot",
          text:   t("done_message"),
        });
        setTimeout(() => navigateToResults(confirmed), 2000);
      } else {
        const extras = text
          .split(",")
          .map((s) => s.trim().toLowerCase())
          .filter(Boolean);

        // Add extras to confirmed — mirrors ques_sugg.py where add_seed()
        // calls _add_symptom_internal() which does confirmed_symptoms.append().
        // Without this, extras never reach navigateToResults and are invisible
        // to the /predict call (the bug: "cough" typed but missing in results).
        const newConfirmed = [...confirmed, ...extras];
        setConfirmed(newConfirmed);

        // Store in state — every subsequent Stage 2 call in this round
        // needs to carry them so the backend reconstructs the pool correctly
        setExtraSeeds(extras);
        setPoolQuestionsAsked(0);

        fetchNextQuestion(
          newConfirmed,
          rejected,
          unsure,
          extras,
          true,         // isSecondRound
          true,         // useBatch
        );
      }
      return;
    }

    // ── Stage 2b: Yes / No / Not Sure for a suggested symptom ─────────────
    if (currentSymptomKey) {
      const answer = text.trim();
      let newConfirmed = [...confirmed];
      let newRejected  = [...rejected];
      let newUnsure    = [...unsure];

      if (answer === t("yes")) {
        newConfirmed = [...confirmed, currentSymptomKey];
        setConfirmed(newConfirmed);
      } else if (answer === t("no")) {
        newRejected = [...rejected, currentSymptomKey];
        setRejected(newRejected);
      } else {
        newUnsure = [...unsure, currentSymptomKey];
        setUnsure(newUnsure);
      }

      setCurrentSymptomKey(null);

      fetchNextQuestion(newConfirmed, newRejected, newUnsure, extraSeeds, inSecondRound, true);
      return;
    }
  };

  const handleSend = () => {
    if (!input.trim()) return;
    handleUserReply(input.trim());
    setInput("");
  };

  const lastBotMessage = [...messages].reverse().find((m) => m.sender === "bot");

  // Disabled while typing, loading batch, batch active, or fully done.
  // Stays enabled while awaitingAdditionalSymptoms so the patient can type extras.
  const inputDisabled = isTyping || conversationDone || batchLoading || pendingBatch !== null || activeVariantMsgId !== null;

  return (
    <div className="flex flex-col bg-medical" style={{ height: "100dvh" }}>

      {/* Header */}
      <div className="border-b border-border bg-card/70 px-4 py-3">
        <div className="mx-auto flex max-w-2xl items-center justify-between">
          <div className="flex items-center gap-2">
            <div
              className="flex h-8 w-8 items-center justify-center rounded-full"
              style={{ backgroundColor: "var(--bot-bubble)" }}
            >
              <Stethoscope className="h-4 w-4 text-primary" />
            </div>
            <span className="text-sm font-semibold text-foreground">{t("symptom_check")}</span>
          </div>
          <button
            onClick={() => navigate("/")}
            className="flex h-8 w-8 items-center justify-center rounded-full transition-colors hover:bg-secondary"
          >
            <X className="h-4 w-4 text-muted-foreground" />
          </button>
        </div>
        <Progress value={progress} className="mx-auto mt-2 h-1.5 max-w-2xl" />
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-6">
        <div className="mx-auto max-w-2xl space-y-4">
          {messages.map((msg) => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex ${msg.sender === "user" ? "justify-end" : "justify-start"}`}
            >
              {msg.sender === "bot" && (
                <div
                  className="mr-2 mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full"
                  style={{ backgroundColor: "var(--bot-bubble)" }}
                >
                  <Stethoscope className="h-4 w-4 text-primary" />
                </div>
              )}
              {msg.variantOptions ? (
                <div className="max-w-[90%]">
                  <VariantSelectForm
                    questionText={msg.variantQuestionText || t("select_all_apply")}
                    options={msg.variantOptions}
                    onSubmit={handleVariantSubmit}
                    disabled={msg.id !== activeVariantMsgId}
                    savedSelections={msg.savedVariantSelections}
                  />
                </div>
              ) : msg.batchQuestions ? (
                <div className="max-w-[90%]">
                  <LikertBatchForm
                    questions={msg.batchQuestions}
                    answers={msg.id === activeBatchMsgId ? batchAnswers : (msg.savedBatchAnswers || {})}
                    onAnswerChange={(symptom, answer) =>
                      setBatchAnswers((prev) => ({ ...prev, [symptom]: answer }))
                    }
                    onSubmit={handleBatchSubmit}
                    disabled={msg.id !== activeBatchMsgId}
                  />
                </div>
              ) : (
                <div
                  className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                    msg.sender === "user"
                      ? "bg-user-bubble text-primary-foreground"
                      : "bg-bot-bubble text-primary-foreground"
                  }`}
                  style={
                    msg.sender === "bot"
                      ? { backgroundColor: "var(--bot-bubble)", color: "var(--primary-foreground)" }
                      : undefined
                  }
                  dangerouslySetInnerHTML={{
                    __html: msg.text.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>"),
                  }}
                />
              )}
            </motion.div>
          ))}

          {isTyping && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex items-start"
            >
              <div
                className="mr-2 mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full"
                style={{ backgroundColor: "var(--bot-bubble)" }}
              >
                <Stethoscope className="h-4 w-4 text-primary" />
              </div>
              <div className="rounded-2xl bg-bot-bubble px-4 py-3">
                <div className="flex gap-1">
                  <span className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground/40" style={{ animationDelay: "0ms" }}   />
                  <span className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground/40" style={{ animationDelay: "150ms" }} />
                  <span className="h-2 w-2 animate-bounce rounded-full bg-muted-foreground/40" style={{ animationDelay: "300ms" }} />
                </div>
              </div>
            </motion.div>
          )}

          {batchLoading && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-start">
              <div
                className="mr-2 mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full"
                style={{ backgroundColor: "var(--bot-bubble)" }}
              >
                <Stethoscope className="h-4 w-4 text-primary" />
              </div>
              <div className="w-full max-w-[90%] rounded-2xl p-4" style={{ backgroundColor: "var(--bot-bubble)" }}>
                <p className="mb-3 text-sm text-muted-foreground">{t("preparing_questions")}</p>
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="mb-2 space-y-2 rounded-xl bg-white/70 p-3">
                    <Skeleton className="h-4 w-3/4" />
                    <div className="flex gap-2">
                      <Skeleton className="h-7 w-14 rounded-full" />
                      <Skeleton className="h-7 w-12 rounded-full" />
                      <Skeleton className="h-7 w-20 rounded-full" />
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </div>
      </div>

      {/* Quick Replies */}
      {lastBotMessage?.quickReplies && !isTyping && !conversationDone && !pendingBatch && !batchLoading && !activeVariantMsgId && (
        <div className="border-t border-border bg-card/50 px-4 py-3">
          <div className="mx-auto flex max-w-2xl flex-wrap gap-2">
            {lastBotMessage.quickReplies.map((reply) => (
              <button
                key={reply}
                onClick={() => handleUserReply(reply)}
                className="rounded-full bg-chip px-4 py-2 text-sm font-medium text-chip-foreground transition-all hover:bg-primary/15"
              >
                {reply}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input */}
      <div className="border-t border-border bg-card/70 px-4 py-3">
        <div className="mx-auto max-w-2xl">
          {awaitingAdditionalSymptoms ? (
            <SymptomAutocomplete
              symptoms={symptomList.filter((s) => chiefComplaintNames.has(s))}
              excluded={[...confirmed, ...rejected, ...unsure, ...symptomIds.map((id) => idToName(id, symptomList).toLowerCase())]}
              onSubmit={(selected) => {
                const label = selected.map((s) => s.replace(/\b\w/g, (c) => c.toUpperCase())).join(", ");
                addMessage({ id: `user-extra-${Date.now()}`, sender: "user", text: label });
                setAwaitingAdditionalSymptoms(false);
                const extras = selected.map((s) => s.toLowerCase());
                const newConfirmed = [...confirmed, ...extras];
                setConfirmed(newConfirmed);
                setExtraSeeds(extras);
                setPoolQuestionsAsked(0);
                fetchNextQuestion(newConfirmed, rejected, unsure, extras, true, true);
              }}
              onSkip={() => {
                addMessage({ id: `user-extra-${Date.now()}`, sender: "user", text: t("no_other_symptoms") });
                setAwaitingAdditionalSymptoms(false);
                setConversationDone(true);
                addMessage({
                  id: "done",
                  sender: "bot",
                  text: t("done_message"),
                });
                setTimeout(() => navigateToResults(confirmed), 2000);
              }}
            />
          ) : (
            <div className="flex gap-2">
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSend()}
                placeholder={t("type_message")}
                className="rounded-full"
                disabled={inputDisabled}
              />
              <Button
                onClick={handleSend}
                disabled={!input.trim() || inputDisabled}
                size="icon"
                className="shrink-0 rounded-full"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Chat;