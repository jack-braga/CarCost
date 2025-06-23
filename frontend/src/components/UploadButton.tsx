import Button from '@mui/material/Button';

export default function UploadButton() {
    return (
        <Button variant="contained" color="primary" component="label">
            Upload File
            <input type="file" hidden />
        </Button>
    );
}