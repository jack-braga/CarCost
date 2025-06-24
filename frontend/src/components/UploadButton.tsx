import { useState } from "react";
import Button from "@mui/material/Button";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";

export default function UploadButton() {
  const [fileArray, setFileArray] = useState<File[]>([]);
  const handleSetFileArray = (newFileList: FileList | null) => {
    if (newFileList === null) {
      setFileArray([]);
      return;
    }
    const newFileArray = [...newFileList];
    setFileArray(newFileArray);
    console.log("newFileArray: ", newFileArray);
  };

  return (
    <Button
      variant="contained"
      color="primary"
      component="label"
      startIcon={<CloudUploadIcon />}
    >
      Upload Files
      <input
        type="file"
        accept="image/*"
        hidden
        onChange={(e) => handleSetFileArray(e.target.files)}
      />
    </Button>
  );
}
