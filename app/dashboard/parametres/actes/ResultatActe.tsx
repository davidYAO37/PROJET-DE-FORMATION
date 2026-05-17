"use client";
import { useState, useEffect, useRef } from "react";
import { Modal, Form, Button, ButtonGroup, Dropdown } from "react-bootstrap";
import { FaSave, FaTimes, FaBold, FaItalic, FaUnderline, FaAlignLeft, FaAlignCenter, FaAlignRight, FaAlignJustify, FaPalette, FaFont, FaListUl, FaListOl, FaIndent, FaOutdent, FaUndo, FaRedo, FaTable, FaTrash, FaPlus, FaObjectGroup, FaPrint, FaEye } from "react-icons/fa";
import { ActeClinique } from "@/types/acteclinique";

type Props = {
    show: boolean;
    acte: ActeClinique | null;
    onClose: () => void;
    onSave: (acteId: string, resultat: string) => void;
};

const ResultatActe: React.FC<Props> = ({ show, acte, onClose, onSave }) => {
    const [resultat, setResultat] = useState("");
    const [saving, setSaving] = useState(false);
    const editorRef = useRef<HTMLDivElement>(null);
    const [fontSize, setFontSize] = useState("12px");
    const [editorHeight, setEditorHeight] = useState(500);
    const [isResizing, setIsResizing] = useState(false);
    const [showPrintPreview, setShowPrintPreview] = useState(false);
    const resizeRef = useRef<HTMLDivElement>(null);

    const handleClose = () => {
        setResultat("");
        onClose();
    };

    const handleSave = async () => {
        if (!acte?._id || !editorRef.current) return;
        
        setSaving(true);
        try {
            const content = editorRef.current.innerHTML;
            await onSave(acte._id, content);
            handleClose();
        } finally {
            setSaving(false);
        }
    };

    // Pré-remplir avec le résultat existant si disponible
    useEffect(() => {
        if (acte?.resultatacte && editorRef.current) {
            editorRef.current.innerHTML = acte.resultatacte;
        } else if (editorRef.current) {
            editorRef.current.innerHTML = "";
        }
    }, [acte]);

    // Fonctions de formatage
    const execCommand = (command: string, value?: string) => {
        document.execCommand(command, false, value);
        editorRef.current?.focus();
    };

    const insertColor = (color: string) => {
        execCommand('foreColor', color);
    };

    const insertBackgroundColor = (color: string) => {
        execCommand('hiliteColor', color);
    };

    const changeFontSize = (size: string) => {
        setFontSize(size);
        execCommand('fontSize', size);
    };

    // Fonctions pour les tableaux
    const insertTable = (rows: number, cols: number) => {
        if (!editorRef.current) return;
        
        let tableHTML = '<table border="1" style="border-collapse: collapse; width: 100%; margin: 10px 0;">';
        for (let i = 0; i < rows; i++) {
            tableHTML += '<tr>';
            for (let j = 0; j < cols; j++) {
                tableHTML += '<td style="border: 1px solid #ddd; padding: 8px; min-width: 100px;">Cellule</td>';
            }
            tableHTML += '</tr>';
        }
        tableHTML += '</table><br>';
        
        execCommand('insertHTML', tableHTML);
    };

    const addTableRow = () => {
        const selection = window.getSelection();
        if (selection && selection.rangeCount > 0) {
            const range = selection.getRangeAt(0);
            const table = range.startContainer.parentElement?.closest('table');
            if (table) {
                const newRow = table.insertRow(-1);
                const colCount = table.rows[0].cells.length;
                for (let i = 0; i < colCount; i++) {
                    const newCell = newRow.insertCell(i);
                    newCell.style.border = '1px solid #ddd';
                    newCell.style.padding = '8px';
                    newCell.style.minWidth = '100px';
                    newCell.textContent = 'Cellule';
                }
            }
        }
    };

    const addTableColumn = () => {
        const selection = window.getSelection();
        if (selection && selection.rangeCount > 0) {
            const range = selection.getRangeAt(0);
            const cell = range.startContainer.parentElement?.closest('td');
            if (cell) {
                const table = cell.closest('table');
                if (table) {
                    const cellIndex = cell.cellIndex;
                    for (let i = 0; i < table.rows.length; i++) {
                        const newCell = table.rows[i].insertCell(cellIndex + 1);
                        newCell.style.border = '1px solid #ddd';
                        newCell.style.padding = '8px';
                        newCell.style.minWidth = '100px';
                        newCell.textContent = 'Cellule';
                    }
                }
            }
        }
    };

    const deleteTable = () => {
        const selection = window.getSelection();
        if (selection && selection.rangeCount > 0) {
            const range = selection.getRangeAt(0);
            const table = range.startContainer.parentElement?.closest('table');
            if (table) {
                table.remove();
            }
        }
    };

    // Gestionnaire pour le copier-coller amélioré (spécial Word)
    const handlePaste = (e: React.ClipboardEvent) => {
        e.preventDefault();
        
        // Obtenir le contenu du presse-papiers
        const clipboardData = e.clipboardData || (window as any).clipboardData;
        const htmlData = clipboardData.getData('text/html');
        const textData = clipboardData.getData('text/plain');
        
        if (htmlData) {
            // Traitement spécial pour les tableaux Word
            const processedHTML = processWordHTML(htmlData);
            execCommand('insertHTML', processedHTML);
        } else if (textData) {
            // Traitement du texte brut avec détection de tableau
            const processedText = processTextData(textData);
            if (processedText.isTable) {
                execCommand('insertHTML', processedText.html);
            } else {
                execCommand('insertText', textData);
            }
        }
    };

    // Fonction pour traiter le HTML de Word
    const processWordHTML = (html: string) => {
        // Créer un DOM parser pour extraire les tableaux
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');
        
        // Extraire tous les tableaux
        const tables = doc.querySelectorAll('table');
        let processedHTML = html;
        
        if (tables.length > 0) {
            // Reconstruire les tableaux avec un formatage propre et alignement centré par défaut
            tables.forEach((table, index) => {
                const cleanTable = createCleanTableWithAlignment(table, 'center');
                processedHTML = processedHTML.replace(table.outerHTML, cleanTable);
            });
        }
        
        // Nettoyer le HTML final
        return processedHTML
            .replace(/<meta[^>]*>/gi, '')
            .replace(/<link[^>]*>/gi, '')
            .replace(/<style[^>]*>.*?<\/style>/gi, '')
            .replace(/<script[^>]*>.*?<\/script>/gi, '')
            .replace(/<!--[\s\S]*?-->/g, '') // Supprimer les commentaires
            .replace(/\s+/g, ' ') // Nettoyer les espaces multiples
            .trim();
    };

    // Fonction pour créer un tableau propre à partir d'un tableau Word
    const createCleanTable = (wordTable: Element) => {
        let tableHTML = '<table border="1" style="border-collapse: collapse; width: 100%; margin: 10px 0; font-family: Arial, sans-serif;">';
        
        const rows = wordTable.querySelectorAll('tr');
        rows.forEach((row) => {
            tableHTML += '<tr>';
            const cells = row.querySelectorAll('td, th');
            cells.forEach((cell) => {
                const cellContent = cell.textContent || '';
                const cellStyle = getCellStyleFromWordCell(cell);
                tableHTML += `<td style="${cellStyle}">${cellContent}</td>`;
            });
            tableHTML += '</tr>';
        });
        
        tableHTML += '</table><br>';
        return tableHTML;
    };

    // Fonction pour extraire le style d'une cellule Word
    const getCellStyleFromWordCell = (cell: Element) => {
        let style = 'border: 1px solid #ddd; padding: 8px; min-width: 100px; vertical-align: top;';
        
        // Extraire les styles de la cellule Word
        const computedStyle = (cell as HTMLElement).style;
        if (computedStyle.backgroundColor) {
            style += ` background-color: ${computedStyle.backgroundColor};`;
        }
        if (computedStyle.color) {
            style += ` color: ${computedStyle.color};`;
        }
        if (computedStyle.fontWeight === 'bold') {
            style += ' font-weight: bold;';
        }
        if (computedStyle.fontStyle === 'italic') {
            style += ' font-style: italic;';
        }
        if (computedStyle.textAlign) {
            style += ` text-align: ${computedStyle.textAlign};`;
        }
        
        return style;
    };

    // Fonction pour traiter les données texte
    const processTextData = (text: string) => {
        const lines = text.split('\n').filter(line => line.trim());
        
        // Détecter si c'est un tableau (plusieurs colonnes avec séparateurs)
        const isTable = lines.length > 1 && lines.some(line => {
            const separators = (line.match(/\t/g) || []).length;
            const spaces = (line.match(/\s{3,}/g) || []).length;
            return separators > 0 || spaces > 0;
        });
        
        if (isTable) {
            let tableHTML = '<table border="1" style="border-collapse: collapse; width: 100%; margin: 10px 0; font-family: Arial, sans-serif;">';
            
            lines.forEach(line => {
                if (line.trim()) {
                    // Diviser par tabulations d'abord, puis par espaces multiples
                    let cells = line.split('\t').map(cell => cell.trim()).filter(cell => cell);
                    
                    if (cells.length <= 1) {
                        // Si pas de tabulations, essayer avec les espaces multiples
                        cells = line.split(/\s{3,}/).map(cell => cell.trim()).filter(cell => cell);
                    }
                    
                    if (cells.length > 1) {
                        tableHTML += '<tr>';
                        cells.forEach(cell => {
                            tableHTML += `<td style="border: 1px solid #ddd; padding: 8px; min-width: 100px; vertical-align: top;">${cell}</td>`;
                        });
                        tableHTML += '</tr>';
                    }
                }
            });
            
            tableHTML += '</table><br>';
            return { isTable: true, html: tableHTML };
        }
        
        return { isTable: false, html: '' };
    };

    // Fonctions pour aligner les tableaux
    const alignTable = (alignment: 'left' | 'center' | 'right') => {
        const selection = window.getSelection();
        if (selection && selection.rangeCount > 0) {
            const range = selection.getRangeAt(0);
            const table = range.startContainer.parentElement?.closest('table');
            if (table) {
                // Créer un conteneur div pour aligner le tableau
                const wrapper = document.createElement('div');
                wrapper.style.textAlign = alignment;
                wrapper.style.marginBottom = '10px';
                
                // Cloner le tableau et l'insérer dans le wrapper
                const tableClone = table.cloneNode(true) as HTMLTableElement;
                wrapper.appendChild(tableClone);
                
                // Remplacer le tableau original par le wrapper
                table.parentNode?.replaceChild(wrapper, table);
                
                // Mettre le focus sur l'éditeur
                editorRef.current?.focus();
            }
        }
    };

    // Fonction pour envelopper un tableau dans un div aligné
    const wrapTableInAlignedDiv = (tableHTML: string, alignment: 'left' | 'center' | 'right') => {
        return `<div style="text-align: ${alignment}; margin-bottom: 10px;">${tableHTML}</div>`;
    };

    // Améliorer la fonction createCleanTable pour inclure l'alignement par défaut (centre)
    const createCleanTableWithAlignment = (wordTable: Element, defaultAlignment: 'left' | 'center' | 'right' = 'center') => {
        let tableHTML = '<table border="1" style="border-collapse: collapse; width: auto; margin: 10px 0; font-family: Arial, sans-serif;">';
        
        const rows = wordTable.querySelectorAll('tr');
        rows.forEach((row) => {
            tableHTML += '<tr>';
            const cells = row.querySelectorAll('td, th');
            cells.forEach((cell) => {
                const cellContent = cell.textContent || '';
                const cellStyle = getCellStyleFromWordCell(cell);
                tableHTML += `<td style="${cellStyle}">${cellContent}</td>`;
            });
            tableHTML += '</tr>';
        });
        
        tableHTML += '</table>';
        return wrapTableInAlignedDiv(tableHTML, defaultAlignment);
    };

    // Fonctions de redimensionnement
    const handleMouseDown = (e: React.MouseEvent) => {
        e.preventDefault();
        setIsResizing(true);
        
        const startY = e.clientY;
        const startHeight = editorHeight;
        
        const handleMouseMove = (e: MouseEvent) => {
            const deltaY = e.clientY - startY;
            const newHeight = Math.max(200, Math.min(1500, startHeight + deltaY));
            setEditorHeight(newHeight);
        };
        
        const handleMouseUp = () => {
            setIsResizing(false);
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
        };
        
        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
    };

    // Effet pour changer le curseur pendant le redimensionnement
    useEffect(() => {
        if (isResizing) {
            document.body.style.cursor = 'ns-resize';
            document.body.style.userSelect = 'none';
        } else {
            document.body.style.cursor = '';
            document.body.style.userSelect = '';
        }
        
        return () => {
            document.body.style.cursor = '';
            document.body.style.userSelect = '';
        };
    }, [isResizing]);

    // Fonctions pour l'aperçu et l'impression
    const handlePrintPreview = () => {
        setShowPrintPreview(true);
    };

    const handlePrint = () => {
        if (!editorRef.current) return;
        
        // Créer une nouvelle fenêtre pour l'impression
        const printWindow = window.open('', '_blank');
        if (!printWindow) return;
        
        // Obtenir le contenu HTML de l'éditeur
        const content = editorRef.current.innerHTML;
        
        // Créer le HTML pour l'impression avec styles flexibles
        const printHTML = `
            <!DOCTYPE html>
            <html>
            <head>
                <title>Résultat de l'acte - ${acte?.designationacte || 'Nouveau'}</title>
                <style>
                    @page {
                        margin: 1cm;
                    }
                    body {
                        font-family: Arial, sans-serif;
                        font-size: 14px;
                        line-height: 1.6;
                        margin: 0;
                        padding: 20px;
                    }
                    .header {
                        text-align: center;
                        margin-bottom: 30px;
                        border-bottom: 2px solid #333;
                        padding-bottom: 10px;
                    }
                    .title {
                        font-size: 20px;
                        font-weight: bold;
                        margin-bottom: 5px;
                    }
                    .subtitle {
                        font-size: 16px;
                        color: #666;
                        margin-bottom: 10px;
                    }
                    .content {
                        margin-bottom: 30px;
                    }
                    table {
                        border-collapse: collapse;
                        width: 100%;
                        margin: 10px 0;
                    }
                    td, th {
                        border: 1px solid #ddd;
                        padding: 8px;
                        vertical-align: top;
                    }
                    .footer {
                        margin-top: 30px;
                        text-align: center;
                        font-size: 10px;
                        color: #999;
                        border-top: 1px solid #ddd;
                        padding-top: 10px;
                    }
                    @media print {
                        .no-print {
                            display: none;
                        }
                    }
                </style>
            </head>
            <body>
                <div class="header">
                    <div class="title">RÉSULTAT DE L'ACTE</div>
                    <div class="subtitle">${acte?.designationacte || 'Acte non spécifié'}</div>
                    <div class="subtitle">Lettre clé: ${acte?.lettreCle || 'N/A'} | Date: ${new Date().toLocaleDateString('fr-FR')}</div>
                </div>
                <div class="content">
                    ${content}
                </div>
                <div class="footer">
                    Document généré le ${new Date().toLocaleDateString('fr-FR')} à ${new Date().toLocaleTimeString('fr-FR')}
                </div>
            </body>
            </html>
        `;
        
        // Écrire le contenu dans la nouvelle fenêtre
        printWindow.document.write(printHTML);
        printWindow.document.close();
        
        // Attendre que le contenu soit chargé puis imprimer
        printWindow.onload = () => {
            setTimeout(() => {
                printWindow.print();
                printWindow.close();
            }, 500);
        };
    };

    const getPrintPreviewContent = () => {
        if (!editorRef.current) return '';
        
        const content = editorRef.current.innerHTML;
        return `
            <div style="font-family: Arial, sans-serif; font-size: 14px; line-height: 1.6; padding: 20px; background: white; width: 100%;">
                <div style="text-align: center; margin-bottom: 30px; border-bottom: 2px solid #333; padding-bottom: 10px;">
                    <div style="font-size: 20px; font-weight: bold; margin-bottom: 5px;">RÉSULTAT DE L'ACTE</div>
                    <div style="font-size: 16px; color: #666; margin-bottom: 5px;">${acte?.designationacte || 'Acte non spécifié'}</div>
                    <div style="font-size: 14px; color: #999;">Lettre clé: ${acte?.lettreCle || 'N/A'} | Date: ${new Date().toLocaleDateString('fr-FR')}</div>
                </div>
                <div style="margin-bottom: 30px;">
                    ${content}
                </div>
                <div style="margin-top: 30px; text-align: center; font-size: 12px; color: #999; border-top: 1px solid #ddd; padding-top: 10px;">
                    Document généré le ${new Date().toLocaleDateString('fr-FR')} à ${new Date().toLocaleTimeString('fr-FR')}
                </div>
            </div>
        `;
    };

    return (
        <>
            <Modal 
                show={show} 
                onHide={handleClose}
                size="xl"
                centered
            >
            <Modal.Header closeButton>
                <Modal.Title>
                    Résultat de l'acte : {acte?.designationacte}
                </Modal.Title>
            </Modal.Header>
            <Modal.Body>
                <Form.Group className="mb-3">
                    <Form.Label>Éditeur de résultat</Form.Label>
                    
                    {/* Toolbar RTF */}
                    <div className="border border-secondary rounded p-2 mb-2 bg-light">
                        <div className="d-flex flex-wrap gap-2 align-items-center">
                            {/* Style de texte */}
                            <ButtonGroup size="sm">
                                <Button variant="outline-secondary" onClick={() => execCommand('bold')} title="Gras">
                                    <FaBold />
                                </Button>
                                <Button variant="outline-secondary" onClick={() => execCommand('italic')} title="Italique">
                                    <FaItalic />
                                </Button>
                                <Button variant="outline-secondary" onClick={() => execCommand('underline')} title="Souligné">
                                    <FaUnderline />
                                </Button>
                            </ButtonGroup>

                            {/* Alignement */}
                            <ButtonGroup size="sm">
                                <Button variant="outline-secondary" onClick={() => execCommand('justifyLeft')} title="Aligner à gauche">
                                    <FaAlignLeft />
                                </Button>
                                <Button variant="outline-secondary" onClick={() => execCommand('justifyCenter')} title="Centrer">
                                    <FaAlignCenter />
                                </Button>
                                <Button variant="outline-secondary" onClick={() => execCommand('justifyRight')} title="Aligner à droite">
                                    <FaAlignRight />
                                </Button>
                                <Button variant="outline-secondary" onClick={() => execCommand('justifyFull')} title="Justifier">
                                    <FaAlignJustify />
                                </Button>
                            </ButtonGroup>

                            {/* Liste */}
                            <ButtonGroup size="sm">
                                <Button variant="outline-secondary" onClick={() => execCommand('insertUnorderedList')} title="Liste à puces">
                                    <FaListUl />
                                </Button>
                                <Button variant="outline-secondary" onClick={() => execCommand('insertOrderedList')} title="Liste numérotée">
                                    <FaListOl />
                                </Button>
                            </ButtonGroup>

                            {/* Indentation */}
                            <ButtonGroup size="sm">
                                <Button variant="outline-secondary" onClick={() => execCommand('outdent')} title="Désindenter">
                                    <FaOutdent />
                                </Button>
                                <Button variant="outline-secondary" onClick={() => execCommand('indent')} title="Indenter">
                                    <FaIndent />
                                </Button>
                            </ButtonGroup>

                            {/* Historique */}
                            <ButtonGroup size="sm">
                                <Button variant="outline-secondary" onClick={() => execCommand('undo')} title="Annuler">
                                    <FaUndo />
                                </Button>
                                <Button variant="outline-secondary" onClick={() => execCommand('redo')} title="Refaire">
                                    <FaRedo />
                                </Button>
                            </ButtonGroup>

                            {/* Couleur du texte */}
                            <Dropdown drop="down">
                                <Dropdown.Toggle variant="outline-secondary" size="sm" title="Couleur du texte">
                                    <FaPalette />
                                </Dropdown.Toggle>
                                <Dropdown.Menu>
                                    <Dropdown.Item onClick={() => insertColor('#000000')} style={{color: '#000000'}}>Noir</Dropdown.Item>
                                    <Dropdown.Item onClick={() => insertColor('#FF0000')} style={{color: '#FF0000'}}>Rouge</Dropdown.Item>
                                    <Dropdown.Item onClick={() => insertColor('#0000FF')} style={{color: '#0000FF'}}>Bleu</Dropdown.Item>
                                    <Dropdown.Item onClick={() => insertColor('#008000')} style={{color: '#008000'}}>Vert</Dropdown.Item>
                                    <Dropdown.Item onClick={() => insertColor('#FFA500')} style={{color: '#FFA500'}}>Orange</Dropdown.Item>
                                    <Dropdown.Item onClick={() => insertColor('#800080')} style={{color: '#800080'}}>Violet</Dropdown.Item>
                                    <Dropdown.Item onClick={() => insertColor('#FFC0CB')} style={{color: '#FFC0CB'}}>Rose</Dropdown.Item>
                                    <Dropdown.Item onClick={() => insertColor('#A52A2A')} style={{color: '#A52A2A'}}>Marron</Dropdown.Item>
                                </Dropdown.Menu>
                            </Dropdown>

                            {/* Couleur de fond */}
                            <Dropdown drop="down">
                                <Dropdown.Toggle variant="outline-warning" size="sm" title="Couleur de fond">
                                    <FaFont />
                                </Dropdown.Toggle>
                                <Dropdown.Menu>
                                    <Dropdown.Item onClick={() => insertBackgroundColor('#FFFFFF')} style={{backgroundColor: '#FFFFFF'}}>Transparent</Dropdown.Item>
                                    <Dropdown.Item onClick={() => insertBackgroundColor('#FFFF00')} style={{backgroundColor: '#FFFF00'}}>Jaune</Dropdown.Item>
                                    <Dropdown.Item onClick={() => insertBackgroundColor('#00FFFF')} style={{backgroundColor: '#00FFFF'}}>Cyan</Dropdown.Item>
                                    <Dropdown.Item onClick={() => insertBackgroundColor('#FFB6C1')} style={{backgroundColor: '#FFB6C1'}}>Rose clair</Dropdown.Item>
                                    <Dropdown.Item onClick={() => insertBackgroundColor('#90EE90')} style={{backgroundColor: '#90EE90'}}>Vert clair</Dropdown.Item>
                                    <Dropdown.Item onClick={() => insertBackgroundColor('#ADD8E6')} style={{backgroundColor: '#ADD8E6'}}>Bleu clair</Dropdown.Item>
                                </Dropdown.Menu>
                            </Dropdown>

                            {/* Taille de police */}
                            <Dropdown drop="down">
                                <Dropdown.Toggle variant="outline-secondary" size="sm" title="Taille de police">
                                    Taille
                                </Dropdown.Toggle>
                                <Dropdown.Menu>
                                    <Dropdown.Item onClick={() => changeFontSize('1')}>Très petit</Dropdown.Item>
                                    <Dropdown.Item onClick={() => changeFontSize('2')}>Petit</Dropdown.Item>
                                    <Dropdown.Item onClick={() => changeFontSize('3')}>Normal</Dropdown.Item>
                                    <Dropdown.Item onClick={() => changeFontSize('4')}>Moyen</Dropdown.Item>
                                    <Dropdown.Item onClick={() => changeFontSize('5')}>Grand</Dropdown.Item>
                                    <Dropdown.Item onClick={() => changeFontSize('6')}>Très grand</Dropdown.Item>
                                    <Dropdown.Item onClick={() => changeFontSize('7')}>Énorme</Dropdown.Item>
                                </Dropdown.Menu>
                            </Dropdown>

                            {/* Tableaux */}
                            <Dropdown drop="down">
                                <Dropdown.Toggle variant="outline-info" size="sm" title="Insérer un tableau">
                                    <FaTable />
                                </Dropdown.Toggle>
                                <Dropdown.Menu>
                                    <Dropdown.Item onClick={() => insertTable(2, 2)}>Tableau 2x2</Dropdown.Item>
                                    <Dropdown.Item onClick={() => insertTable(3, 3)}>Tableau 3x3</Dropdown.Item>
                                    <Dropdown.Item onClick={() => insertTable(4, 4)}>Tableau 4x4</Dropdown.Item>
                                    <Dropdown.Item onClick={() => insertTable(2, 4)}>Tableau 2x4</Dropdown.Item>
                                    <Dropdown.Item onClick={() => insertTable(4, 2)}>Tableau 4x2</Dropdown.Item>
                                    <Dropdown.Divider />
                                    <Dropdown.Item onClick={() => insertTable(5, 5)}>Tableau 5x5</Dropdown.Item>
                                    <Dropdown.Item onClick={() => insertTable(10, 3)}>Tableau 10x3</Dropdown.Item>
                                </Dropdown.Menu>
                            </Dropdown>

                            {/* Actions tableau */}
                            <ButtonGroup size="sm">
                                <Button variant="outline-success" onClick={addTableRow} title="Ajouter une ligne">
                                    <FaPlus />
                                </Button>
                                <Button variant="outline-warning" onClick={addTableColumn} title="Ajouter une colonne">
                                    <FaPlus style={{ transform: 'rotate(90deg)' }} />
                                </Button>
                                <Button variant="outline-danger" onClick={deleteTable} title="Supprimer le tableau">
                                    <FaTrash />
                                </Button>
                            </ButtonGroup>

                            {/* Alignement de tableau */}
                            <ButtonGroup size="sm">
                                <Button variant="outline-info" onClick={() => alignTable('left')} title="Aligner tableau à gauche">
                                    <FaAlignLeft />
                                </Button>
                                <Button variant="outline-primary" onClick={() => alignTable('center')} title="Centrer tableau">
                                    <FaAlignCenter />
                                </Button>
                                <Button variant="outline-info" onClick={() => alignTable('right')} title="Aligner tableau à droite">
                                    <FaAlignRight />
                                </Button>
                            </ButtonGroup>
                        </div>
                    </div>

                    {/* Éditeur de contenu */}
                    <div style={{ position: 'relative' }}>
                        <div
                            ref={editorRef}
                            contentEditable
                            className="border border-secondary rounded p-3"
                            style={{
                                height: `${editorHeight}px`, // Hauteur dynamique
                                width: '100%',
                                fontSize: '14px',
                                fontFamily: 'Arial, sans-serif',
                                lineHeight: '1.6',
                                overflow: 'auto',
                                backgroundColor: '#FFFFFF',
                                minHeight: '200px',
                                maxHeight: '1500px',
                                padding: '15px'
                            }}
                            data-placeholder="Copiez-collez le résultat de l'acte ici..."
                            onPaste={handlePaste}
                        />
                        
                        {/* Zone de redimensionnement */}
                        <div
                            ref={resizeRef}
                            onMouseDown={handleMouseDown}
                            style={{
                                position: 'absolute',
                                bottom: '0',
                                left: '0',
                                right: '0',
                                height: '8px',
                                background: 'linear-gradient(to bottom, transparent, #007bff)',
                                cursor: 'ns-resize',
                                borderRadius: '0 0 0.375rem 0.375rem',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                            }}
                            title="Redimensionner l'éditeur"
                        >
                            <div style={{
                                width: '40px',
                                height: '3px',
                                backgroundColor: '#007bff',
                                borderRadius: '2px',
                                opacity: 0.7
                            }} />
                        </div>
                    </div>
                </Form.Group>
                <small className="text-muted">
                    Éditeur RTF complet. Utilisez la toolbar pour formater le texte (gras, couleur, alignement...). 
                    Support complet du copier-coller de tableaux Word avec préservation du formatage. 
                    Les tableaux sont centrés par défaut, utilisez les boutons d'alignement pour ajuster leur position.
                    Tirez la barre bleue en bas pour redimensionner l'éditeur. 
                    Utilisez les boutons Aperçu et Imprimer pour générer des documents.
                </small>
            </Modal.Body>
            <Modal.Footer>
                <Button variant="outline-info" onClick={handlePrintPreview} disabled={saving}>
                    <FaEye className="me-2" />
                    Aperçu
                </Button>
                <Button variant="outline-success" onClick={handlePrint} disabled={saving}>
                    <FaPrint className="me-2" />
                    Imprimer
                </Button>
                <Button variant="secondary" onClick={handleClose} disabled={saving}>
                    <FaTimes className="me-2" />
                    Annuler
                </Button>
                <Button variant="primary" onClick={handleSave} disabled={saving}>
                    {saving && <span className="spinner-border spinner-border-sm me-2" />}
                    <FaSave className="me-2" />
                    Valider
                </Button>
            </Modal.Footer>
        </Modal>

        {/* Modal d'aperçu d'impression */}
        <Modal 
            show={showPrintPreview} 
            onHide={() => setShowPrintPreview(false)}
            size="lg"
            centered
        >
            <Modal.Header closeButton>
                <Modal.Title>
                    <FaEye className="me-2" />
                    Aperçu d'impression - {acte?.designationacte}
                </Modal.Title>
            </Modal.Header>
            <Modal.Body>
                <div style={{
                    backgroundColor: '#f5f5f5',
                    padding: '20px',
                    borderRadius: '8px',
                    overflow: 'auto',
                    maxHeight: '600px'
                }}>
                    <div style={{
                        backgroundColor: 'white',
                        width: '100%',
                        margin: '0 auto',
                        padding: '20px',
                        boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
                        borderRadius: '4px'
                    }}>
                        <div dangerouslySetInnerHTML={{ __html: getPrintPreviewContent() }} />
                    </div>
                </div>
            </Modal.Body>
            <Modal.Footer>
                <Button variant="secondary" onClick={() => setShowPrintPreview(false)}>
                    Fermer l'aperçu
                </Button>
                <Button variant="success" onClick={handlePrint}>
                    <FaPrint className="me-2" />
                    Imprimer
                </Button>
            </Modal.Footer>
        </Modal>
        </>
    );
};

export default ResultatActe;
