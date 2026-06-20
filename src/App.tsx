import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import SymptomBrowse from "./pages/SymptomBrowse";
import SymptomCheck from "./pages/SymptomCheck";
import Chat from "./pages/Chat";
import Results from "./pages/Results";
import NotFound from "./pages/NotFound";
const App = () => (
  <BrowserRouter>
    <Routes>
      <Route path="/" element={<Index />} />
      <Route path="/browse" element={<SymptomBrowse />} />
      <Route path="/check" element={<SymptomCheck />} />
      <Route path="/chat" element={<Chat />} />
      <Route path="/results" element={<Results />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  </BrowserRouter>
);

export default App;
