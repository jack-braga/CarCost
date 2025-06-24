import { Routes, Route } from "react-router-dom";
import ReceiptUpload from "./ReceiptUpload";

function Pages() {
  return (
    <Routes>
      <Route path="/" element={<ReceiptUpload />} />
    </Routes>
  );
}

export default Pages;
