import React, { useState, useRef, useCallback } from 'react';
import './RichTextEditor.css';

/**
 * RichTextEditor - A WYSIWYG editor component for admin content management
 * Supports visual editing with HTML stored in the background
 * 
 * Features:
 * - Visual/HTML toggle view
 * - Formatting toolbar (bold, italic, underline, headings, lists, links, etc.)
 * - Image insertion
 * - Table support
 * - Undo/Redo
 */
const RichTextEditor = ({ 
  value = '', 
  onChange, 
  placeholder = 'Start typing...', 
  minHeight = 300,
  maxHeight = 600 
}) => {
  const [isHtmlMode, setIsHtmlMode] = useState(false);
  const [htmlValue, setHtmlValue] = useState(value);
  const editorRef = useRef(null);
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [showImageModal, setShowImageModal] = useState(false);
  const [linkUrl, setLinkUrl] = useState('');
  const [linkText, setLinkText] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [imageAlt, setImageAlt] = useState('');

  // Execute formatting command
  const execCommand = useCallback((command, value = null) => {
    document.execCommand(command, false, value);
    editorRef.current?.focus();
    handleContentChange();
  }, []);

  // Handle content changes in visual mode
  const handleContentChange = useCallback(() => {
    if (editorRef.current) {
      const html = editorRef.current.innerHTML;
      setHtmlValue(html);
      onChange?.(html);
    }
  }, [onChange]);

  // Handle HTML mode changes
  const handleHtmlChange = useCallback((e) => {
    const html = e.target.value;
    setHtmlValue(html);
    onChange?.(html);
  }, [onChange]);

  // Toggle between visual and HTML mode
  const toggleMode = useCallback(() => {
    if (isHtmlMode) {
      // Switching to visual mode - update editor content
      if (editorRef.current) {
        editorRef.current.innerHTML = htmlValue;
      }
    } else {
      // Switching to HTML mode - get current content
      if (editorRef.current) {
        setHtmlValue(editorRef.current.innerHTML);
      }
    }
    setIsHtmlMode(!isHtmlMode);
  }, [isHtmlMode, htmlValue]);

  // Insert link
  const insertLink = useCallback(() => {
    if (linkUrl) {
      const text = linkText || linkUrl;
      execCommand('insertHTML', `<a href="${linkUrl}" target="_blank">${text}</a>`);
    }
    setShowLinkModal(false);
    setLinkUrl('');
    setLinkText('');
  }, [linkUrl, linkText, execCommand]);

  // Insert image
  const insertImage = useCallback(() => {
    if (imageUrl) {
      execCommand('insertHTML', `<img src="${imageUrl}" alt="${imageAlt || ''}" style="max-width: 100%;" />`);
    }
    setShowImageModal(false);
    setImageUrl('');
    setImageAlt('');
  }, [imageUrl, imageAlt, execCommand]);

  // Insert table
  const insertTable = useCallback(() => {
    const tableHtml = `
      <table style="border-collapse: collapse; width: 100%; margin: 1rem 0;">
        <tr>
          <th style="border: 1px solid #ddd; padding: 8px; background: #f5f5f5;">Header 1</th>
          <th style="border: 1px solid #ddd; padding: 8px; background: #f5f5f5;">Header 2</th>
          <th style="border: 1px solid #ddd; padding: 8px; background: #f5f5f5;">Header 3</th>
        </tr>
        <tr>
          <td style="border: 1px solid #ddd; padding: 8px;">Cell 1</td>
          <td style="border: 1px solid #ddd; padding: 8px;">Cell 2</td>
          <td style="border: 1px solid #ddd; padding: 8px;">Cell 3</td>
        </tr>
        <tr>
          <td style="border: 1px solid #ddd; padding: 8px;">Cell 4</td>
          <td style="border: 1px solid #ddd; padding: 8px;">Cell 5</td>
          <td style="border: 1px solid #ddd; padding: 8px;">Cell 6</td>
        </tr>
      </table>
    `;
    execCommand('insertHTML', tableHtml);
  }, [execCommand]);

  // Insert info box
  const insertInfoBox = useCallback(() => {
    const infoHtml = `
      <div style="background: #e3f2fd; border-left: 4px solid #2196f3; padding: 1rem; margin: 1rem 0; border-radius: 4px;">
        <strong>💡 Tip:</strong> Your information here
      </div>
    `;
    execCommand('insertHTML', infoHtml);
  }, [execCommand]);

  // Insert warning box
  const insertWarningBox = useCallback(() => {
    const warningHtml = `
      <div style="background: #fff3e0; border-left: 4px solid #ff9800; padding: 1rem; margin: 1rem 0; border-radius: 4px;">
        <strong>⚠️ Important:</strong> Your warning here
      </div>
    `;
    execCommand('insertHTML', warningHtml);
  }, [execCommand]);

  // Toolbar button component
  const ToolbarButton = ({ onClick, icon, title, active = false }) => (
    <button
      type="button"
      className={`rte-toolbar-btn ${active ? 'active' : ''}`}
      onClick={onClick}
      title={title}
    >
      <i className={`fas fa-${icon}`}></i>
    </button>
  );

  // Toolbar separator
  const ToolbarSeparator = () => <div className="rte-toolbar-separator" />;

  return (
    <div className="rich-text-editor">
      {/* Toolbar */}
      <div className="rte-toolbar">
        {/* Text formatting */}
        <ToolbarButton onClick={() => execCommand('bold')} icon="bold" title="Bold (Ctrl+B)" />
        <ToolbarButton onClick={() => execCommand('italic')} icon="italic" title="Italic (Ctrl+I)" />
        <ToolbarButton onClick={() => execCommand('underline')} icon="underline" title="Underline (Ctrl+U)" />
        <ToolbarButton onClick={() => execCommand('strikeThrough')} icon="strikethrough" title="Strikethrough" />
        
        <ToolbarSeparator />
        
        {/* Headings */}
        <select 
          className="rte-toolbar-select"
          onChange={(e) => {
            if (e.target.value) {
              execCommand('formatBlock', e.target.value);
            }
            e.target.value = '';
          }}
          defaultValue=""
        >
          <option value="" disabled>Heading</option>
          <option value="p">Paragraph</option>
          <option value="h1">Heading 1</option>
          <option value="h2">Heading 2</option>
          <option value="h3">Heading 3</option>
          <option value="h4">Heading 4</option>
        </select>
        
        <ToolbarSeparator />
        
        {/* Lists */}
        <ToolbarButton onClick={() => execCommand('insertUnorderedList')} icon="list-ul" title="Bullet List" />
        <ToolbarButton onClick={() => execCommand('insertOrderedList')} icon="list-ol" title="Numbered List" />
        
        <ToolbarSeparator />
        
        {/* Alignment */}
        <ToolbarButton onClick={() => execCommand('justifyLeft')} icon="align-left" title="Align Left" />
        <ToolbarButton onClick={() => execCommand('justifyCenter')} icon="align-center" title="Align Center" />
        <ToolbarButton onClick={() => execCommand('justifyRight')} icon="align-right" title="Align Right" />
        
        <ToolbarSeparator />
        
        {/* Insert elements */}
        <ToolbarButton onClick={() => setShowLinkModal(true)} icon="link" title="Insert Link" />
        <ToolbarButton onClick={() => setShowImageModal(true)} icon="image" title="Insert Image" />
        <ToolbarButton onClick={insertTable} icon="table" title="Insert Table" />
        
        <ToolbarSeparator />
        
        {/* Special boxes */}
        <ToolbarButton onClick={insertInfoBox} icon="info-circle" title="Insert Info Box" />
        <ToolbarButton onClick={insertWarningBox} icon="exclamation-triangle" title="Insert Warning Box" />
        
        <ToolbarSeparator />
        
        {/* Undo/Redo */}
        <ToolbarButton onClick={() => execCommand('undo')} icon="undo" title="Undo (Ctrl+Z)" />
        <ToolbarButton onClick={() => execCommand('redo')} icon="redo" title="Redo (Ctrl+Y)" />
        
        {/* Mode toggle */}
        <div className="rte-toolbar-right">
          <button
            type="button"
            className={`rte-mode-toggle ${isHtmlMode ? 'html-mode' : ''}`}
            onClick={toggleMode}
            title={isHtmlMode ? 'Switch to Visual Mode' : 'Switch to HTML Mode'}
          >
            <i className={`fas fa-${isHtmlMode ? 'eye' : 'code'}`}></i>
            {isHtmlMode ? 'Visual' : 'HTML'}
          </button>
        </div>
      </div>

      {/* Editor area */}
      <div className="rte-editor-container" style={{ minHeight, maxHeight }}>
        {isHtmlMode ? (
          <textarea
            className="rte-html-editor"
            value={htmlValue}
            onChange={handleHtmlChange}
            placeholder="Enter HTML code..."
            style={{ minHeight, maxHeight }}
          />
        ) : (
          <div
            ref={editorRef}
            className="rte-visual-editor"
            contentEditable
            onInput={handleContentChange}
            onBlur={handleContentChange}
            dangerouslySetInnerHTML={{ __html: value }}
            data-placeholder={placeholder}
            style={{ minHeight, maxHeight }}
          />
        )}
      </div>

      {/* Link Modal */}
      {showLinkModal && (
        <div className="rte-modal-overlay" onClick={() => setShowLinkModal(false)}>
          <div className="rte-modal" onClick={(e) => e.stopPropagation()}>
            <div className="rte-modal-header">
              <h3>Insert Link</h3>
              <button className="rte-modal-close" onClick={() => setShowLinkModal(false)}>
                <i className="fas fa-times"></i>
              </button>
            </div>
            <div className="rte-modal-body">
              <div className="rte-form-group">
                <label>URL</label>
                <input
                  type="url"
                  value={linkUrl}
                  onChange={(e) => setLinkUrl(e.target.value)}
                  placeholder="https://example.com"
                  autoFocus
                />
              </div>
              <div className="rte-form-group">
                <label>Link Text (optional)</label>
                <input
                  type="text"
                  value={linkText}
                  onChange={(e) => setLinkText(e.target.value)}
                  placeholder="Click here"
                />
              </div>
            </div>
            <div className="rte-modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowLinkModal(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={insertLink}>Insert Link</button>
            </div>
          </div>
        </div>
      )}

      {/* Image Modal */}
      {showImageModal && (
        <div className="rte-modal-overlay" onClick={() => setShowImageModal(false)}>
          <div className="rte-modal" onClick={(e) => e.stopPropagation()}>
            <div className="rte-modal-header">
              <h3>Insert Image</h3>
              <button className="rte-modal-close" onClick={() => setShowImageModal(false)}>
                <i className="fas fa-times"></i>
              </button>
            </div>
            <div className="rte-modal-body">
              <div className="rte-form-group">
                <label>Image URL</label>
                <input
                  type="url"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  placeholder="https://example.com/image.jpg"
                  autoFocus
                />
              </div>
              <div className="rte-form-group">
                <label>Alt Text (for accessibility)</label>
                <input
                  type="text"
                  value={imageAlt}
                  onChange={(e) => setImageAlt(e.target.value)}
                  placeholder="Describe the image"
                />
              </div>
              {imageUrl && (
                <div className="rte-image-preview">
                  <img src={imageUrl} alt="Preview" onError={(e) => e.target.style.display = 'none'} />
                </div>
              )}
            </div>
            <div className="rte-modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowImageModal(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={insertImage}>Insert Image</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RichTextEditor;
