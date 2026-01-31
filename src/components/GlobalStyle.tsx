import type React from 'react';
import { useEffect } from 'react';

export default function GlobalStyle(): React.ReactElement | null {
  useEffect((): (() => void) => {
    const styleTag = document.createElement('style');
    styleTag.innerHTML = `
      @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;600&display=swap');

      html, body {
        min-height: 100%;
        margin: 0;
        padding: 0;
        font-family: 'Poppins', sans-serif;
        background: #2f4f4f;
        color: #e0e0e0;
        font-size: 17px;
        line-height: 1.6;
        letter-spacing: 0.2px;
        scroll-behavior: smooth;
        -webkit-font-smoothing: antialiased;
      }

      h1, h2, h3 {
        font-weight: 600;
        color: #ffffff;
        margin-top: 1.2em;
        margin-bottom: 0.4em;
      }

      p, li {
        font-size: 1em;
        margin-bottom: 0.7em;
        color: #d0d0d0;
      }

      button, input, textarea, select {
        font-size: 1.1em;
        min-height: 42px;
        font-family: inherit;
      }

      .main-area {
        background: #2f4f4f !important;
        padding: 16px 12px 80px;
        transition: background 0.3s ease;
        min-height: 100vh;
      }

      .card {
        background: #3b5b5b;
        border-radius: 16px;
        box-shadow: 0 4px 20px rgba(0,0,0,0.15);
        padding: 18px 14px;
        margin-bottom: 20px;
        color: #abebc6;
      }

      .card:hover {
        box-shadow: 0 6px 24px rgba(0,0,0,0.2);
      }

      button {
        background-color: #5dade2;
        color: #fff;
        border: none;
        border-radius: 8px;
        padding: 10px 18px;
        font-size: 16px;
        cursor: pointer;
        transition: background-color 0.2s ease;
      }

      button:hover {
        background-color: #4a92c7;
      }

      button:focus-visible {
        outline: 3px solid #97ccf0;
        outline-offset: 2px;
      }

      input, select, textarea {
        background-color: #4a6a6a;
        color: white;
        border: 1px solid #a0d0c0;
        border-radius: 8px;
        padding: 10px;
        width: 100%;
        box-sizing: border-box;
        margin-bottom: 12px;
      }

      input:focus, select:focus, textarea:focus {
        border-color: #5dade2;
        outline: none;
      }
@keyframes fadeInOut {
  0% {
    opacity: 0;
    transform: translateY(20px);
  }
  10% {
    opacity: 1;
    transform: translateY(0);
  }
  90% {
    opacity: 1;
    transform: translateY(0);
  }
  100% {
    opacity: 0;
    transform: translateY(20px);
  }
}

      .sidebar {
        background: #2f4f4f;
        color: white;
        z-index: 200;
        box-shadow: 4px 0 18px rgba(0,0,0,0.2);
        transform: translateX(-100%);
        opacity: 0;
        visibility: hidden;
        transition: transform 0.6s ease, opacity 0.6s ease, visibility 0.6s ease;
        display: flex;
        flex-direction: column;
        position: fixed;
        top: 0;
        left: 0;
        width: 240px;
        height: 100vh;
        overflow: hidden;
      }
      
      /* Sidebar content and logout button layout */
      .sidebar-content {
        flex: 1;
        overflow-y: auto;
        display: flex;
        flex-direction: column;
      }
      
      .logout-button {
        margin-top: auto;
        border-top: 1px solid rgba(255, 255, 255, 0.1);
        background: rgba(255, 255, 255, 0.05);
        color: #ff6b6b;
      }
      
      .logout-button:hover {
        background: rgba(255, 255, 255, 0.1);
      }

      .sidebar.open {
        transform: translateX(0);
                transition: transform 0.6s ease, opacity 0.6s ease, visibility 0.6s ease;
        opacity: 1;
        visibility: visible;
      }
.sidebar-points {
  padding: 10px 16px;
  margin-bottom: 16px;
  background-color: #2f4f4f;
  color: #ffffff;
  border-radius: 12px;
  font-weight: bold;
  font-size: 14px;
  text-align: center;
}
      .sidebar button,
      .sidebar a {
        background: transparent;
        border: none;
        color: inherit;
        font-size: 16px;
        text-align: left;
        text-decoration: none;
        padding: 12px 20px;
        width: calc(100% - 0px);
        cursor: pointer;
        transition: background 0.2s;
        display: flex;
        align-items: center;
        gap: 10px;
        box-sizing: border-box;
        margin: 0;
      }

      .sidebar button .icon,
      .sidebar a .icon {
        display: flex;
        align-items: center;
      }

      .sidebar button .label,
      .sidebar a .label {
        flex: 1;
        text-align: left;
      }

      .sidebar button:hover,
      .sidebar button.active,
      .sidebar a:hover,
      .sidebar a.active {
        background: rgba(255, 255, 255, 0.1);
      }

      .sidebar-toggle-mobile {
        position: fixed;
        top: 16px;
        right: 16px;
        background: #abebc6;
        color: #2f4f4f;
        border: none;
        border-radius: 50%;
        width: 44px;
        height: 44px;
        font-size: 20px;
        z-index: 210;
        box-shadow: 0 2px 10px rgba(0,0,0,0.2);
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        transition: all 0.2s ease;
      }

      .sidebar-toggle-mobile:hover {
        background: #9de4b8;
        transform: scale(1.05);
        box-shadow: 0 4px 12px rgba(0,0,0,0.25);
      }

      .sidebar-toggle-mobile:active {
        transform: scale(0.95);
      }

      ::-webkit-scrollbar {
        width: 6px;
      }

      ::-webkit-scrollbar-thumb {
        background: #5dade2;
        border-radius: 6px;
      }

      .toast-notification {
        position: fixed;
        bottom: 20px;
        left: 50%;
        transform: translateX(-50%);
        color: white;
        padding: 12px 24px;
        border-radius: 24px;
        box-shadow: 0 4px 16px rgba(0,0,0,0.1);
        font-weight: bold;
        animation: fadeInOut 1.3s ease-in-out;
        z-index: 9999;
      }

      .toast-success {
        background: #5dade2;
      }

      .toast-error {
        background: #e74c3c;
      }

      .toast-info {
        background: #3498db;
      }

      @keyframes fadeInOut {
        0% { opacity: 0; transform: translateY(10px); }
        10% { opacity: 1; transform: translateY(0); }
        90% { opacity: 1; }
        100% { opacity: 0; transform: translateY(-10px); }
      }

      /* BackButton component styling */
      .back-button {
        background: #abebc6;
        border: none;
        border-radius: 16px;
        padding: 12px 20px;
        font-size: 16px;
        font-weight: 500;
        color: #2f4f4f;
        cursor: pointer;
        transition: all 0.2s ease;
        display: flex;
        align-items: center;
        gap: 10px;
        margin-bottom: 16px;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        min-height: auto;
      }

      .back-button:hover {
        background: #9de4b8;
        transform: translateY(-1px);
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      }

      .back-button:active {
        transform: translateY(0);
        box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
      }

      .back-button:focus-visible {
        outline: 2px solid #5dade2;
        outline-offset: 2px;
      }

      /* Emoji Selection Styles */
      .emoji-row {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
        margin: 12px 0;
        padding: 8px;
        background: rgba(255, 255, 255, 0.05);
        border-radius: 12px;
      }

      .emoji-selector {
        font-size: 28px;
        padding: 8px;
        border-radius: 8px;
        cursor: pointer;
        transition: all 0.2s ease;
        background: transparent;
        border: 2px solid transparent;
        display: flex;
        align-items: center;
        justify-content: center;
        min-width: 44px;
        min-height: 44px;
        user-select: none;
        position: relative;
      }

      /* Desktop hover effects */
      @media (hover: hover) {
        .emoji-selector:hover {
          transform: scale(1.1);
          background: rgba(93, 173, 226, 0.1);
          border-color: rgba(93, 173, 226, 0.3);
          box-shadow: 0 2px 8px rgba(93, 173, 226, 0.2);
        }

        .emoji-selector:hover::after {
          content: attr(title);
          position: absolute;
          bottom: -30px;
          left: 50%;
          transform: translateX(-50%);
          background: #2f4f4f;
          color: white;
          padding: 4px 8px;
          border-radius: 4px;
          font-size: 12px;
          white-space: nowrap;
          z-index: 1000;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
        }
      }

      /* Active/selected state */
      .emoji-selector.active {
        background: #5dade2;
        border-color: #4a92c7;
        transform: scale(1.05);
        box-shadow: 0 4px 12px rgba(93, 173, 226, 0.3);
      }

      /* Mobile touch feedback */
      @media (hover: none) {
        .emoji-selector:active {
          transform: scale(0.95);
          background: rgba(93, 173, 226, 0.2);
          transition: all 0.1s ease;
        }
      }

      /* Focus styles for accessibility */
      .emoji-selector:focus {
        outline: 2px solid #5dade2;
        outline-offset: 2px;
      }

      /* Animation for selection */
      @keyframes emojiSelect {
        0% { transform: scale(1); }
        50% { transform: scale(1.2); }
        100% { transform: scale(1.05); }
      }

      .emoji-selector.just-selected {
        animation: emojiSelect 0.3s ease;
      }

      /* Form and Layout Improvements */
      .section {
        margin: 24px 0;
        padding: 16px 0;
        user-select: none;
        -webkit-user-select: none;
        -moz-user-select: none;
        -ms-user-select: none;
      }

      .section h3 {
        margin-top: 0;
        margin-bottom: 16px;
        color: #ffffff;
        font-size: 1.3em;
      }

      .form-row {
        display: flex;
        gap: 12px;
        align-items: flex-start;
        margin-bottom: 16px;
      }

      .form-row input {
        flex: 1;
        margin-bottom: 0;
      }

      .form-row button {
        flex-shrink: 0;
        min-width: 44px;
        height: 44px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 18px;
        font-weight: bold;
      }

      /* List styling improvements */
      ul {
        list-style: none;
        padding: 0;
        margin: 0;
      }

      li {
        background: rgba(255, 255, 255, 0.05);
        border-radius: 8px;
        padding: 12px 16px;
        margin-bottom: 8px;
        display: flex;
        align-items: center;
        gap: 12px;
        transition: background 0.2s ease;
      }

      li:hover {
        background: rgba(255, 255, 255, 0.08);
      }

      li.done {
        opacity: 0.7;
        text-decoration: line-through;
      }

      li input[type="checkbox"] {
        width: auto;
        margin: 0;
        flex-shrink: 0;
      }

      li .text-content {
        flex: 1;
        word-break: break-word;
        user-select: none;
      }

      li .actions {
        display: flex;
        gap: 8px;
        flex-shrink: 0;
      }

      /* Template buttons */
      .templates {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
        margin-bottom: 16px;
      }

      .template-btn {
        background: rgba(93, 173, 226, 0.2);
        border: 1px solid rgba(93, 173, 226, 0.4);
        color: #ffffff;
        padding: 8px 12px;
        border-radius: 6px;
        font-size: 14px;
        cursor: pointer;
        transition: all 0.2s ease;
      }

      .template-btn:hover {
        background: rgba(93, 173, 226, 0.3);
        border-color: rgba(93, 173, 226, 0.6);
      }

      /* Action buttons in lists */
      .share-btn {
        background: #abebc6;
        color: #5dade2;
        border: none;
        border-radius: 4px;
        padding: 4px 8px;
        font-size: 12px;
        cursor: pointer;
        transition: background 0.2s ease;
      }

      .share-btn:hover {
        background: #097c38;
        color: #ffffff;
      }

      .delete-btn {
        background: #ffdddd;
        color: #bb2222;
        border: none;
        border-radius: 4px;
        padding: 4px 8px;
        font-size: 12px;
        cursor: pointer;
        transition: all 0.2s ease;
        min-width: 28px;
        height: 28px;
        display: flex;
        align-items: center;
        justify-content: center;
      }

      .delete-btn:hover {
        background: #ffcccc;
        color: #aa1111;
      }

      /* Stat banner */
      .stat-banner {
        background: rgba(11, 148, 68, 0.1);
        border: 1px solid rgba(11, 148, 68, 0.3);
        border-radius: 8px;
        padding: 12px 16px;
        margin: 16px 0;
        color: #ffffff;
        text-align: center;
        font-weight: 500;
      }

      .reminder {
        background: rgba(255, 193, 7, 0.1);
        border: 1px solid rgba(255, 193, 7, 0.3);
        border-radius: 8px;
        padding: 12px 16px;
        margin: 16px 0;
        color: #ffffff;
        text-align: center;
        font-weight: 500;
      }

      /* Textarea improvements */
      textarea {
        min-height: 80px;
        resize: vertical;
        font-family: inherit;
      }

      /* Simple range input styling - let browser handle track */
      input[type="range"] {
        width: 100%;
        height: 25px;
        background: transparent;
        outline: none;
      }

      input[type="range"]::-webkit-slider-thumb {
        -webkit-appearance: none;
        appearance: none;
        height: 20px;
        width: 20px;
        border-radius: 50%;
        background: #5dade2;
        cursor: pointer;
        border: 2px solid #ffffff;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
      }

      input[type="range"]::-moz-range-thumb {
        height: 20px;
        width: 20px;
        border-radius: 50%;
        background: #5dade2;
        cursor: pointer;
        border: 2px solid #ffffff;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
      }

      /* Design page specific styles */
      .theme-options, .background-options {
        display: flex;
        flex-wrap: wrap;
        gap: 12px;
        margin-bottom: 16px;
      }

      .theme-options button, .background-options button {
        background: rgba(255, 255, 255, 0.1);
        border: 2px solid rgba(255, 255, 255, 0.2);
        color: #ffffff;
        padding: 12px 16px;
        border-radius: 8px;
        cursor: pointer;
        transition: all 0.2s ease;
        font-weight: 500;
      }

      .theme-options button:hover, .background-options button:hover {
        background: rgba(255, 255, 255, 0.15);
        border-color: rgba(93, 173, 226, 0.5);
      }

      .theme-options button.selected, .background-options button.selected {
        background: #5dade2;
        border-color: #4a92c7;
        color: #ffffff;
        box-shadow: 0 2px 8px rgba(93, 173, 226, 0.3);
      }

      /* Quick items grid for HomeScreen */
      .quick-items-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
        gap: 12px;
        margin: 16px 0;
      }

      .quick-item {
        background: rgba(255, 255, 255, 0.05);
        border: 1px solid rgba(255, 255, 255, 0.1);
        border-radius: 12px;
        padding: 16px 12px;
        text-align: center;
        cursor: pointer;
        transition: all 0.2s ease;
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 8px;
        min-height: 80px;
      }

      .quick-item:hover {
        background: rgba(255, 255, 255, 0.08);
        border-color: rgba(93, 173, 226, 0.3);
        transform: translateY(-2px);
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
      }

      .quick-item .icon {
        font-size: 24px;
        margin-bottom: 4px;
      }

      .quick-item .label {
        font-size: 14px;
        font-weight: 500;
        color: #ffffff;
      }

      /* Welcome section */
      .welcome-section {
        background: rgba(93, 173, 226, 0.1);
        border: 1px solid rgba(93, 173, 226, 0.2);
        border-radius: 12px;
        padding: 20px;
        margin: 16px 0;
        text-align: center;
        user-select: none;
        -webkit-user-select: none;
        -moz-user-select: none;
        -ms-user-select: none;
      }

      .welcome-section h3 {
        margin-top: 0;
        color: #5dade2;
      }

      /* Edit button for quick items */
      .edit-quick-items {
        background: rgba(255, 255, 255, 0.1);
        border: 1px solid rgba(255, 255, 255, 0.2);
        color: #ffffff;
        padding: 8px 16px;
        border-radius: 6px;
        cursor: pointer;
        transition: all 0.2s ease;
        font-size: 14px;
        margin-top: 12px;
      }

      .edit-quick-items:hover {
        background: rgba(255, 255, 255, 0.15);
        border-color: rgba(93, 173, 226, 0.4);
      }

      /* Notfall page contact list styling */
      .contact-list {
        display: flex;
        flex-direction: column;
        gap: 12px;
        margin: 16px 0;
        padding: 16px;
        background: rgba(255, 255, 255, 0.05);
        border-radius: 8px;
      }

      .contact-list a {
        display: block;
        padding: 12px 16px;
        background: rgba(171, 235, 198, 0.1);
        border: 1px solid rgba(171, 235, 198, 0.3);
        border-radius: 8px;
        text-decoration: none;
        font-weight: 500;
        transition: all 0.2s ease;
      }

      .contact-list a:hover {
        background: rgba(171, 235, 198, 0.2);
        border-color: rgba(171, 235, 198, 0.5);
        transform: translateY(-1px);
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
      }

      /* Guide page mobile-friendly styling */
      .card ul {
        padding-left: 0;
        margin: 16px 0;
      }

      .card ul li {
        background: rgba(255, 255, 255, 0.05);
        border-radius: 12px;
        padding: 16px;
        margin-bottom: 12px;
        display: flex;
        align-items: flex-start;
        gap: 12px;
        line-height: 1.5;
        word-wrap: break-word;
        overflow-wrap: break-word;
        position: relative;
      }


      .card ul li span:first-child {
        flex-shrink: 0;
        font-size: 1.2em;
        margin-top: 2px;
        margin-left: 8px;
      }

      .card ul li .content {
        flex: 1;
        min-width: 0;
      }

      .card ul li a {
        color: #abebc6;
        text-decoration: none;
        word-break: break-all;
        display: inline-block;
        margin: 0 2px;
        padding: 2px 4px;
        border-radius: 4px;
        transition: all 0.2s ease;
      }

      .card ul li a:hover {
        background: rgba(171, 235, 198, 0.1);
        text-decoration: underline;
        color: #9de4b8;
      }

      .card ul li b {
        color: #ffffff;
        font-weight: 600;
        margin-right: 6px;
      }

      /* QuickEdit page specific styling */
      .card .section ul li {
        align-items: center;
        padding: 12px 16px;
        gap: 12px;
      }

      .card .section ul li input[type="checkbox"] {
        margin: 0;
        flex-shrink: 0;
      }

      .card .section ul li .text-content {
        display: flex;
        align-items: center;
        flex: 1;
        margin: 0;
      }

      /* Skills page specific styling */
      .card > ul li {
        align-items: center;
        padding: 12px 16px;
        gap: 12px;
      }

      .card > ul li input[type="checkbox"] {
        margin: 0;
        flex-shrink: 0;
      }

      .card > ul li .text-content {
        display: flex;
        align-items: center;
        flex: 1;
        margin: 0;
      }

      /* Mobile specific adjustments for Guide */
      @media (max-width: 480px) {
        .card ul li {
          padding: 14px 12px;
          gap: 10px;
        }

        .card ul li span:first-child {
          font-size: 1.1em;
          margin-left: 6px;
        }

        .card ul li a {
          word-break: break-word;
          line-height: 1.4;
        }

        .card h2 {
          font-size: 1.4em;
          line-height: 1.3;
        }

        .card p {
          font-size: 0.95em;
          line-height: 1.5;
        }
      }

      @media (max-width: 360px) {
        .card ul li {
          padding: 12px 10px;
          gap: 8px;
        }

        .card ul li::before {
          min-width: 20px;
          height: 20px;
          font-size: 12px;
        }

        .card ul li span:first-child {
          font-size: 1em;
          margin-left: 4px;
        }
      }

      /* DatenschutzModal styling */
      .ds-modal {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.7);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 1000;
        padding: 20px;
        box-sizing: border-box;
      }

      .ds-box {
        background: #3b5b5b;
        border-radius: 16px;
        padding: 24px;
        max-width: 450px;
        max-height: 70vh;
        width: 100%;
        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
        color: #ffffff;
        text-align: center;
        animation: modalSlideIn 0.3s ease-out;
        overflow-y: auto;
      }

      @keyframes modalSlideIn {
        from {
          opacity: 0;
          transform: translateY(-20px) scale(0.95);
        }
        to {
          opacity: 1;
          transform: translateY(0) scale(1);
        }
      }

      .ds-box p {
        margin: 0 0 20px 0;
        line-height: 1.5;
        color: #d0d0d0;
        font-size: 16px;
      }

      .ds-box button {
        background: #abebc6;
        color: #2f4f4f;
        border: none;
        border-radius: 12px;
        padding: 12px 24px;
        font-size: 16px;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.2s ease;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
      }

      .ds-box button:hover {
        background: #9de4b8;
        transform: translateY(-1px);
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      }

      .ds-box button:active {
        transform: translateY(0);
        box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
      }

      /* Loading Spinner Animation */
      .loading-spinner {
        fontSize: 48px;
        marginBottom: 20px;
        animation: spin 2s linear infinite;
      }

      @keyframes spin {
        from {
          transform: rotate(0deg);
        }
        to {
          transform: rotate(360deg);
        }
      }

      /* BackButton component styling */
      .back-button {
        background: #abebc6;
        border: none;
        border-radius: 16px;
        padding: 12px 20px;
        font-size: 16px;
        font-weight: 500;
        color: #2f4f4f;
        cursor: pointer;
        transition: all 0.2s ease;
        display: flex;
        align-items: center;
        gap: 10px;
        margin-bottom: 16px;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        min-height: auto;
      }

      .back-button:hover {
        background: #9de4b8;
        transform: translateY(-1px);
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      }

      .back-button:active {
        transform: translateY(0);
        box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
      }

      .back-button:focus-visible {
        outline: 2px solid #5dade2;
        outline-offset: 2px;
      }

      /* Emoji Selection Styles */
      .emoji-row {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
        margin: 12px 0;
        padding: 8px;
        background: rgba(255, 255, 255, 0.05);
        border-radius: 12px;
      }

      .emoji-selector {
        font-size: 28px;
        padding: 8px;
        border-radius: 8px;
        cursor: pointer;
        transition: all 0.2s ease;
        background: transparent;
        border: 2px solid transparent;
        display: flex;
        align-items: center;
        justify-content: center;
        min-width: 44px;
        min-height: 44px;
        user-select: none;
        position: relative;
      }

      /* Desktop hover effects */
      @media (hover: hover) {
        .emoji-selector:hover {
          transform: scale(1.1);
          background: rgba(93, 173, 226, 0.1);
          border-color: rgba(93, 173, 226, 0.3);
          box-shadow: 0 2px 8px rgba(93, 173, 226, 0.2);
        }

        .emoji-selector:hover::after {
          content: attr(title);
          position: absolute;
          bottom: -30px;
          left: 50%;
          transform: translateX(-50%);
          background: #2f4f4f;
          color: white;
          padding: 4px 8px;
          border-radius: 4px;
          font-size: 12px;
          white-space: nowrap;
          z-index: 1000;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
        }
      }

      /* Active/selected state */
      .emoji-selector.active {
        background: #5dade2;
        border-color: #4a92c7;
        transform: scale(1.05);
        box-shadow: 0 4px 12px rgba(93, 173, 226, 0.3);
      }

      /* Mobile touch feedback */
      @media (hover: none) {
        .emoji-selector:active {
          transform: scale(0.95);
          background: rgba(93, 173, 226, 0.2);
          transition: all 0.1s ease;
        }
      }

      /* Focus styles for accessibility */
      .emoji-selector:focus {
        outline: 2px solid #5dade2;
        outline-offset: 2px;
      }

      /* Animation for selection */
      @keyframes emojiSelect {
        0% { transform: scale(1); }
        50% { transform: scale(1.2); }
        100% { transform: scale(1.05); }
      }

      .emoji-selector.just-selected {
        animation: emojiSelect 0.3s ease;
      }

      /* Form and Layout Improvements */
      .section {
        margin: 24px 0;
        padding: 16px 0;
      }

      .section h3 {
        margin-top: 0;
        margin-bottom: 16px;
        color: #ffffff;
        font-size: 1.3em;
      }

      .form-row {
        display: flex;
        gap: 12px;
        align-items: flex-start;
        margin-bottom: 16px;
      }

      .form-row input {
        flex: 1;
        margin-bottom: 0;
      }

      .form-row button {
        flex-shrink: 0;
        min-width: 44px;
        height: 44px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 18px;
        font-weight: bold;
      }

      /* List styling improvements */
      ul {
        list-style: none;
        padding: 0;
        margin: 0;
      }

      li {
        background: rgba(255, 255, 255, 0.05);
        border-radius: 8px;
        padding: 12px 16px;
        margin-bottom: 8px;
        display: flex;
        align-items: center;
        gap: 12px;
        transition: background 0.2s ease;
      }

      li:hover {
        background: rgba(255, 255, 255, 0.08);
      }

      li.done {
        opacity: 0.7;
        text-decoration: line-through;
      }

      li input[type="checkbox"] {
        width: auto;
        margin: 0;
        flex-shrink: 0;
      }

      li .text-content {
        flex: 1;
        word-break: break-word;
      }

      li .actions {
        display: flex;
        gap: 8px;
        flex-shrink: 0;
      }

      /* Template buttons */
      .templates {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
        margin-bottom: 16px;
      }

      .template-btn {
        background: rgba(93, 173, 226, 0.2);
        border: 1px solid rgba(93, 173, 226, 0.4);
        color: #ffffff;
        padding: 8px 12px;
        border-radius: 6px;
        font-size: 14px;
        cursor: pointer;
        transition: all 0.2s ease;
      }

      .template-btn:hover {
        background: rgba(93, 173, 226, 0.3);
        border-color: rgba(93, 173, 226, 0.6);
      }

      /* Action buttons in lists */
      .share-btn {
        background: #abebc6;
        color: #5dade2;
        border: none;
        border-radius: 4px;
        padding: 4px 8px;
        font-size: 12px;
        cursor: pointer;
        transition: background 0.2s ease;
      }

      .share-btn:hover {
        background: #097c38;
        color: #ffffff;
      }

      .delete-btn {
        background: #ffdddd;
        color: #bb2222;
        border: none;
        border-radius: 4px;
        padding: 4px 8px;
        font-size: 12px;
        cursor: pointer;
        transition: all 0.2s ease;
        min-width: 28px;
        height: 28px;
        display: flex;
        align-items: center;
        justify-content: center;
      }

      .delete-btn:hover {
        background: #ffcccc;
        color: #aa1111;
      }

      /* Stat banner */
      .stat-banner {
        background: rgba(11, 148, 68, 0.1);
        border: 1px solid rgba(11, 148, 68, 0.3);
        border-radius: 8px;
        padding: 12px 16px;
        margin: 16px 0;
        color: #ffffff;
        text-align: center;
        font-weight: 500;
      }

      .reminder {
        background: rgba(255, 193, 7, 0.1);
        border: 1px solid rgba(255, 193, 7, 0.3);
        border-radius: 8px;
        padding: 12px 16px;
        margin: 16px 0;
        color: #ffffff;
        text-align: center;
        font-weight: 500;
      }

      /* Textarea improvements */
      textarea {
        min-height: 80px;
        resize: vertical;
        font-family: inherit;
      }

      /* Simple range input styling - let browser handle track */
      input[type="range"] {
        width: 100%;
        height: 25px;
        background: transparent;
        outline: none;
      }

      input[type="range"]::-webkit-slider-thumb {
        -webkit-appearance: none;
        appearance: none;
        height: 20px;
        width: 20px;
        border-radius: 50%;
        background: #5dade2;
        cursor: pointer;
        border: 2px solid #ffffff;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
      }

      input[type="range"]::-moz-range-thumb {
        height: 20px;
        width: 20px;
        border-radius: 50%;
        background: #5dade2;
        cursor: pointer;
        border: 2px solid #ffffff;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
      }

      /* Design page specific styles */
      .theme-options, .background-options {
        display: flex;
        flex-wrap: wrap;
        gap: 12px;
        margin-bottom: 16px;
      }

      .theme-options button, .background-options button {
        background: rgba(255, 255, 255, 0.1);
        border: 2px solid rgba(255, 255, 255, 0.2);
        color: #ffffff;
        padding: 12px 16px;
        border-radius: 8px;
        cursor: pointer;
        transition: all 0.2s ease;
        font-weight: 500;
      }

      .theme-options button:hover, .background-options button:hover {
        background: rgba(255, 255, 255, 0.15);
        border-color: rgba(93, 173, 226, 0.5);
      }

      .theme-options button.selected, .background-options button.selected {
        background: #5dade2;
        border-color: #4a92c7;
        color: #ffffff;
        box-shadow: 0 2px 8px rgba(93, 173, 226, 0.3);
      }

      /* Quick items grid for HomeScreen */
      .quick-items-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
        gap: 12px;
        margin: 16px 0;
      }

      .quick-item {
        background: rgba(255, 255, 255, 0.05);
        border: 1px solid rgba(255, 255, 255, 0.1);
        border-radius: 12px;
        padding: 16px 12px;
        text-align: center;
        cursor: pointer;
        transition: all 0.2s ease;
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 8px;
        min-height: 80px;
      }

      .quick-item:hover {
        background: rgba(255, 255, 255, 0.08);
        border-color: rgba(93, 173, 226, 0.3);
        transform: translateY(-2px);
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
      }

      .quick-item .icon {
        font-size: 24px;
        margin-bottom: 4px;
      }

      .quick-item .label {
        font-size: 14px;
        font-weight: 500;
        color: #ffffff;
      }

      /* Welcome section */
      .welcome-section {
        background: rgba(93, 173, 226, 0.1);
        border: 1px solid rgba(93, 173, 226, 0.2);
        border-radius: 12px;
        padding: 20px;
        margin: 16px 0;
        text-align: center;
      }

      .welcome-section h3 {
        margin-top: 0;
        color: #5dade2;
      }

      /* Edit button for quick items */
      .edit-quick-items {
        background: rgba(255, 255, 255, 0.1);
        border: 1px solid rgba(255, 255, 255, 0.2);
        color: #ffffff;
        padding: 8px 16px;
        border-radius: 6px;
        cursor: pointer;
        transition: all 0.2s ease;
        font-size: 14px;
        margin-top: 12px;
      }

      .edit-quick-items:hover {
        background: rgba(255, 255, 255, 0.15);
        border-color: rgba(93, 173, 226, 0.4);
      }

      /* Notfall page contact list styling */
      .contact-list {
        display: flex;
        flex-direction: column;
        gap: 12px;
        margin: 16px 0;
        padding: 16px;
        background: rgba(255, 255, 255, 0.05);
        border-radius: 8px;
      }

      .contact-list a {
        display: block;
        padding: 12px 16px;
        background: rgba(171, 235, 198, 0.1);
        border: 1px solid rgba(171, 235, 198, 0.3);
        border-radius: 8px;
        text-decoration: none;
        font-weight: 500;
        transition: all 0.2s ease;
      }

      .contact-list a:hover {
        background: rgba(171, 235, 198, 0.2);
        border-color: rgba(171, 235, 198, 0.5);
        transform: translateY(-1px);
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
      }

      /* Guide page mobile-friendly styling */
      .card ul {
        padding-left: 0;
        margin: 16px 0;
      }

      .card ul li {
        background: rgba(255, 255, 255, 0.05);
        border-radius: 12px;
        padding: 16px;
        margin-bottom: 12px;
        display: flex;
        align-items: flex-start;
        gap: 12px;
        line-height: 1.5;
        word-wrap: break-word;
        overflow-wrap: break-word;
        position: relative;
      }


      .card ul li span:first-child {
        flex-shrink: 0;
        font-size: 1.2em;
        margin-top: 2px;
        margin-left: 8px;
      }

      .card ul li .content {
        flex: 1;
        min-width: 0;
      }

      .card ul li a {
        color: #abebc6;
        text-decoration: none;
        word-break: break-all;
        display: inline-block;
        margin: 0 2px;
        padding: 2px 4px;
        border-radius: 4px;
        transition: all 0.2s ease;
      }

      .card ul li a:hover {
        background: rgba(171, 235, 198, 0.1);
        text-decoration: underline;
        color: #9de4b8;
      }

      .card ul li b {
        color: #ffffff;
        font-weight: 600;
        margin-right: 6px;
      }

      /* QuickEdit page specific styling */
      .card .section ul li {
        align-items: center;
        padding: 12px 16px;
        gap: 12px;
      }

      .card .section ul li input[type="checkbox"] {
        margin: 0;
        flex-shrink: 0;
      }

      .card .section ul li .text-content {
        display: flex;
        align-items: center;
        flex: 1;
        margin: 0;
      }

      /* Mobile specific adjustments for Guide */
      @media (max-width: 480px) {
        .card ul li {
          padding: 14px 12px;
          gap: 10px;
        }

        .card ul li span:first-child {
          font-size: 1.1em;
          margin-left: 6px;
        }

        .card ul li a {
          word-break: break-word;
          line-height: 1.4;
        }

        .card h2 {
          font-size: 1.4em;
          line-height: 1.3;
        }

        .card p {
          font-size: 0.95em;
          line-height: 1.5;
        }
      }

      @media (max-width: 360px) {
        .card ul li {
          padding: 12px 10px;
          gap: 8px;
        }

        .card ul li::before {
          min-width: 20px;
          height: 20px;
          font-size: 12px;
        }

        .card ul li span:first-child {
          font-size: 1em;
          margin-left: 4px;
        }
      }

      /* DatenschutzModal styling */
      .ds-modal {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.7);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 1000;
        padding: 20px;
        box-sizing: border-box;
      }

      .ds-box {
        background: #3b5b5b;
        border-radius: 16px;
        padding: 24px;
        max-width: 450px;
        max-height: 70vh;
        width: 100%;
        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
        color: #ffffff;
        text-align: center;
        animation: modalSlideIn 0.3s ease-out;
        overflow-y: auto;
      }

      @keyframes modalSlideIn {
        from {
          opacity: 0;
          transform: translateY(-20px) scale(0.95);
        }
        to {
          opacity: 1;
          transform: translateY(0) scale(1);
        }
      }

      .ds-box p {
        margin: 0 0 20px 0;
        line-height: 1.5;
        color: #d0d0d0;
        font-size: 16px;
      }

      .ds-box button {
        background: #abebc6;
        color: #2f4f4f;
        border: none;
        border-radius: 12px;
        padding: 12px 24px;
        font-size: 16px;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.2s ease;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
      }

      .ds-box button:hover {
        background: #9de4b8;
        transform: translateY(-1px);
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      }

      .ds-box button:active {
        transform: translateY(0);
        box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
      }

      /* Neues Desktop-Layout */
      @media (min-width: 700px) {
        .main-area {
          margin-left: 240px;
          min-height: 100vh;
          background: #2f4f4f;
          padding: 24px 32px;
        }

        .sidebar {
          position: fixed;
          top: 0;
          left: 0;
          width: 240px;
          height: 100vh;
          transform: none !important;
          opacity: 1 !important;
          visibility: visible !important;
          background: #2f4f4f;
          z-index: 200;
          box-shadow: 4px 0 18px rgba(0, 0, 0, 0.2);
        }

        .sidebar-toggle-mobile {
          display: none;
        }
      }
    `;
    document.head.appendChild(styleTag);
    return () => {
      document.head.removeChild(styleTag);
    };
  }, []);

  return null;
}
