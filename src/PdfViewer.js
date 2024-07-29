import React, { useRef, useEffect, useState } from 'react';
import * as pdfjsLib from 'pdfjs-dist/webpack';
import pdfWorker from 'pdfjs-dist/build/pdf.worker.entry';
import './PdfViewer.css';

pdfjsLib.GlobalWorkerOptions.workerSrc = URL.createObjectURL(new Blob([pdfWorker], { type: 'application/javascript' }));

const PdfViewer = ({ file }) => {
    const containerRef = useRef(null);
    const [pdf, setPdf] = useState(null);
    const [scale, setScale] = useState(1.0);
    const [selectedPages, setSelectedPages] = useState([]);

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
            renderSelectedPages();
        }
    }, [pdf, scale, selectedPages]);

    const renderSelectedPages = () => {
        const container = containerRef.current;
        if (container) {
            container.innerHTML = '';
            selectedPages.forEach((pageNum) => {
                renderPage(pageNum);
            });
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

            page.render(renderContext).promise.then(() => {
                console.log(`Page ${pageNumber} rendered at scale ${scale}`);
            }).catch((error) => {
                console.error(`Error rendering page: ${error}`);
            });

            if (containerRef.current) {
                containerRef.current.appendChild(canvas);
            }
        });
    };

    const handleZoomIn = () => {
        setScale((prevScale) => prevScale + 0.5);
    };

    const handleZoomOut = () => {
        setScale((prevScale) => Math.max(prevScale - 0.5, 0.5));
    };

    const handlePageSelection = (event) => {
        const input = event.target.value;
        const pages = input.split(',').flatMap((part) => {
            if (part.includes('-')) {
                const [start, end] = part.split('-').map(num => parseInt(num.trim()));
                if (start > 0 && end <= pdf.numPages && start <= end) {
                    return Array.from({ length: end - start + 1 }, (_, i) => start + i);
                } else {
                    return [];
                }
            } else {
                const num = parseInt(part.trim());
                if (num > 0 && num <= pdf.numPages) {
                    return [num];
                } else {
                    return [];
                }
            }
        });
        setSelectedPages([...new Set(pages)]);
    };

    const selectOddPages = () => {
        const pages = Array.from({ length: pdf.numPages }, (_, i) => i + 1).filter(page => page % 2 !== 0);
        setSelectedPages(pages);
    };

    const selectEvenPages = () => {
        const pages = Array.from({ length: pdf.numPages }, (_, i) => i + 1).filter(page => page % 2 === 0);
        setSelectedPages(pages);
    };

    useEffect(() => {
        const container = containerRef.current;

        let startDistance = 0;
        let initialScale = scale;

        const handleTouchStart = (event) => {
            if (event.touches.length === 2) {
                const touch1 = event.touches[0];
                const touch2 = event.touches[1];
                const distance = Math.hypot(touch1.clientX - touch2.clientX, touch1.clientY - touch2.clientY);
                startDistance = distance;
                initialScale = scale;
            }
        };

        const handleTouchMove = (event) => {
            if (event.touches.length === 2) {
                const touch1 = event.touches[0];
                const touch2 = event.touches[1];
                const distance = Math.hypot(touch1.clientX - touch2.clientX, touch1.clientY - touch2.clientY);
                const newScale = initialScale * (distance / startDistance);
                setScale(newScale);
            }
        };

        container.addEventListener('touchstart', handleTouchStart);
        container.addEventListener('touchmove', handleTouchMove);

        return () => {
            container.removeEventListener('touchstart', handleTouchStart);
            container.removeEventListener('touchmove', handleTouchMove);
        };
    }, [scale]);

    return (
        <div className="pdf-viewer">
            <div className="controls">
                <button onClick={handleZoomIn}>Zoom In</button>
                <button onClick={handleZoomOut}>Zoom Out</button>
                <input type="text" placeholder="Enter pages (e.g., 1-3, 5)" onChange={handlePageSelection} />
                <button onClick={selectOddPages}>Odd Pages</button>
                <button onClick={selectEvenPages}>Even Pages</button>
            </div>
            <div ref={containerRef} className="pdf-container" />
        </div>
    );
};

export default PdfViewer;
