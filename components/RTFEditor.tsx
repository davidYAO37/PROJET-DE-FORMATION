"use client";

import React, { useRef, useEffect } from 'react';
import { Form, Button } from 'react-bootstrap';
import { FaBold, FaItalic, FaUnderline, FaAlignLeft, FaAlignCenter, FaAlignRight, FaPalette } from 'react-icons/fa';

interface RTFEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  label?: string;
  required?: boolean;
}

export default function RTFEditor({ 
  value, 
  onChange, 
  placeholder, 
  label, 
  required 
}: RTFEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (editorRef.current && value !== editorRef.current.innerHTML) {
      editorRef.current.innerHTML = value;
    }
  }, [value]);

  const handleInput = () => {
    if (editorRef.current) {
      const content = editorRef.current.innerHTML;
      onChange(content);
    }
  };

  const execCommand = (command: string, value?: string) => {
    document.execCommand(command, false, value);
    editorRef.current?.focus();
  };

  const handleColorChange = (color: string) => {
    execCommand('foreColor', color);
  };

  const handleSizeChange = (size: string) => {
    execCommand('fontSize', size);
  };

  return (
    <Form.Group className="mb-3">
      {label && <Form.Label>{label} {required && <span className="text-danger">*</span>}</Form.Label>}
      
      {/* Barre d'outils de formatage */}
      <div className="border border-bottom-0 p-2 bg-light d-flex gap-1 flex-wrap align-items-center">
        <Button
          size="sm"
          variant="outline-secondary"
          onClick={() => execCommand('bold')}
          title="Gras"
        >
          <FaBold />
        </Button>
        <Button
          size="sm"
          variant="outline-secondary"
          onClick={() => execCommand('italic')}
          title="Italique"
        >
          <FaItalic />
        </Button>
        <Button
          size="sm"
          variant="outline-secondary"
          onClick={() => execCommand('underline')}
          title="Souligné"
        >
          <FaUnderline />
        </Button>
        
        <div className="border-start mx-1"></div>
        
        <Button
          size="sm"
          variant="outline-secondary"
          onClick={() => execCommand('justifyLeft')}
          title="Aligner à gauche"
        >
          <FaAlignLeft />
        </Button>
        <Button
          size="sm"
          variant="outline-secondary"
          onClick={() => execCommand('justifyCenter')}
          title="Centrer"
        >
          <FaAlignCenter />
        </Button>
        <Button
          size="sm"
          variant="outline-secondary"
          onClick={() => execCommand('justifyRight')}
          title="Aligner à droite"
        >
          <FaAlignRight />
        </Button>
        
        <div className="border-start mx-1"></div>
        
        {/* Sélecteur de couleur */}
        <div className="d-flex align-items-center gap-1">
          <Form.Label className="mb-0 me-1">Couleur:</Form.Label>
          <Form.Control
            type="color"
            size="sm"
            style={{ width: '40px', height: '31px' }}
            onChange={(e) => handleColorChange(e.target.value)}
            title="Choisir la couleur du texte"
          />
        </div>
        
        <div className="border-start mx-1"></div>
        
        {/* Sélecteur de taille */}
        <div className="d-flex align-items-center gap-1">
          <Form.Label className="mb-0 me-1">Taille:</Form.Label>
          <Form.Select
            size="sm"
            style={{ width: '80px' }}
            defaultValue="3"
            onChange={(e) => handleSizeChange(e.target.value)}
            title="Choisir la taille du texte"
          >
            <option value="1">Très petit</option>
            <option value="2">Petit</option>
            <option value="3">Normal</option>
            <option value="4">Moyen</option>
            <option value="5">Grand</option>
            <option value="6">Très grand</option>
            <option value="7">Énorme</option>
          </Form.Select>
        </div>
      </div>
      
      {/* Éditeur de contenu */}
      <div
        ref={editorRef}
        contentEditable
        className="border p-3 min-vh-25"
        style={{ 
          minHeight: '120px',
          maxHeight: '300px',
          overflowY: 'auto',
          backgroundColor: '#fff'
        }}
        onInput={handleInput}
        suppressContentEditableWarning={true}
      />
      
      {!value && placeholder && (
        <div className="text-muted mt-1" style={{ fontSize: '0.875em' }}>
          {placeholder}
        </div>
      )}
      
      <Form.Text className="text-muted">
        Utilisez la barre d'outils pour formater votre texte. Le formatage RTF est préservé.
      </Form.Text>
    </Form.Group>
  );
}
