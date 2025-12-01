/**
 * Grammar Writing Assistant - Background Service Worker
 */

const GRAMMAR_RULES = [
  { pattern: /\bi\b/g, replacement: 'I', type: 'capitalization' },
  { pattern: /\s{2,}/g, replacement: ' ', type: 'spacing' },
  { pattern: /\byour\b(?=\s+(?:a|an|the|going|doing|being))/gi, replacement: "you're", type: 'grammar' },
  { pattern: /\bthier\b/gi, replacement: 'their', type: 'spelling' },
  { pattern: /\bteh\b/gi, replacement: 'the', type: 'spelling' },
  { pattern: /\brecieve\b/gi, replacement: 'receive', type: 'spelling' },
  { pattern: /\bseperate\b/gi, replacement: 'separate', type: 'spelling' },
  { pattern: /\boccured\b/gi, replacement: 'occurred', type: 'spelling' },
  { pattern: /\buntill\b/gi, replacement: 'until', type: 'spelling' },
  { pattern: /\bdefinately\b/gi, replacement: 'definitely', type: 'spelling' },
  { pattern: /\baccommodate\b/gi, replacement: 'accommodate', type: 'spelling' },
  { pattern: /\,([^\s])/g, replacement: ', $1', type: 'punctuation' },
  { pattern: /\.([A-Z])/g, replacement: '. $1', type: 'punctuation' }
];

function checkGrammar(text) {
  const issues = [];
  let correctedText = text;
  
  GRAMMAR_RULES.forEach(rule => {
    const matches = text.match(rule.pattern);
    if (matches) {
      matches.forEach(match => {
        issues.push({ original: match, suggestion: rule.replacement, type: rule.type });
      });
      correctedText = correctedText.replace(rule.pattern, rule.replacement);
    }
  });
  
  return { issues, correctedText, score: Math.max(0, 100 - issues.length * 5) };
}

function improveWriting(text) {
  // Simple improvements
  let improved = text;
  improved = improved.replace(/very\s+good/gi, 'excellent');
  improved = improved.replace(/very\s+bad/gi, 'terrible');
  improved = improved.replace(/a lot of/gi, 'numerous');
  improved = improved.replace(/in order to/gi, 'to');
  improved = improved.replace(/due to the fact that/gi, 'because');
  return improved;
}

chrome.contextMenus.create({
  id: 'check-grammar',
  title: 'Check Grammar',
  contexts: ['selection']
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === 'check-grammar' && info.selectionText) {
    const result = checkGrammar(info.selectionText);
    chrome.tabs.sendMessage(tab.id, { type: 'SHOW_RESULTS', result });
  }
});

chrome.runtime.onMessage.addListener((msg, sender, respond) => {
  switch (msg.type) {
    case 'CHECK_GRAMMAR': respond({ success: true, ...checkGrammar(msg.text) }); break;
    case 'IMPROVE_WRITING': respond({ success: true, improved: improveWriting(msg.text) }); break;
    default: respond({ success: false });
  }
  return true;
});
