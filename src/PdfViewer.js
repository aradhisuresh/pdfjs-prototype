import React, { useRef, useEffect, useState } from 'react';
import * as pdfjsLib from 'pdfjs-dist/webpack';
import pdfWorker from 'pdfjs-dist/build/pdf.worker.entry';
import './PdfViewer.css';

pdfjsLib.GlobalWorkerOptions.workerSrc = URL.createObjectURL(new Blob([pdfWorker], { type: 'application/javascript' }));

const PdfViewer = ({ file }) => {
    const containerRef = useRef(null);
    const [pdf, setPdf] = useState(null);
    const [scale, setScale] = useState(1.0);

    useEffect(() => {
        if (file) {
            const loadingTask = pdfjsLib.getDocument(file);
            loadingTask.promise.then((loadedPdf) => {
                setPdf(loadedPdf);
            }, (reason) => {
                console.error(`Error loading PDF: ${reason}`);
            });
        }
    }, [file]);

    useEffect(() => {
        if (pdf) {
            renderAllPages();
        }
    }, [pdf, scale]);

    const renderAllPages = () => {
        const container = containerRef.current;
        container.innerHTML = '';
        for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
            renderPage(pageNum);
        }
    };

    const renderPage = (pageNumber) => {
        pdf.getPage(pageNumber).then((page) => {
            const viewport = page.getViewport({ scale });
            const canvas = document.createElement('canvas');
            const context = canvas.getContext('2d');

            canvas.height = viewport.height;
            canvas.width = viewport.width;

            const renderContext = {
                canvasContext: context,
                viewport: viewport,
            };

            context.clearRect(0, 0, canvas.width, canvas.height);

            page.render(renderContext).promise.then(() => {
                console.log(`Page ${pageNumber} rendered at scale ${scale}`);
            }).catch((error) => {
                console.error(`Error rendering page: ${error}`);
            });

            containerRef.current.appendChild(canvas);
        });
    };

    const handleZoomIn = () => {
        setScale((prevScale) => prevScale + 0.1);
    };

    const handleZoomOut = () => {
        setScale((prevScale) => Math.max(prevScale - 0.1, 0.1));
    };

    return (
        <div className="pdf-viewer">
            <div className="controls">
                <button onClick={handleZoomIn}>Zoom In</button>
                <button onClick={handleZoomOut}>Zoom Out</button>
            </div>
            <div ref={containerRef} className="pdf-container" />
        </div>
    );
};

export default PdfViewer;
