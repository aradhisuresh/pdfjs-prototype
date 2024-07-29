import React, { useState } from 'react';
import PdfViewer from './PdfViewer';
import './App.css';

function App() {
    const [file, setFile] = useState(null);

    const handleFileChange = (event) => {
        const file = event.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                setFile(e.target.result);
            };
            reader.readAsDataURL(file);
        }
    };

    return (
        <div className="App">
            <header className="App-header">
                <input type="file" onChange={handleFileChange} />
                {file && <PdfViewer file={file} />}
            </header>
        </div>
    );
}

export default App;
