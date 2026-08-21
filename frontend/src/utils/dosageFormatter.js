/**
 * Medical Dosage & Frequency Human-Friendly Interpreter
 * Supports multilingual labels (English, Hindi, Telugu, Marathi).
 * 
 * Rules:
 * - 1 means "Take medicine", 0 means "Don't take medicine".
 * - Converts "1-0-1", "1-1-1", "1-0-0", "0-0-1", "BD", "TDS", "OD" into
 *   clear human-readable instructions.
 */

export function parseDosagePattern(dosageStr, freqStr, timingStr, durationStr) {
  const combined = `${dosageStr || ''} ${freqStr || ''}`.trim();

  let morning = null;
  let afternoon = null;
  let night = null;
  let customInstructions = '';

  // 1. Check for standard 3-part or 4-part numeric pattern (e.g. 1-0-1, 1 - 0 - 1, 1/2-0-1/2, 2-0-2)
  const patternMatch = combined.match(/\b(\d+(?:\.\d+|\/\d+)?)\s*[-–—\/]\s*(\d+(?:\.\d+|\/\d+)?)\s*[-–—\/]\s*(\d+(?:\.\d+|\/\d+)?)(?:\s*[-–—\/]\s*(\d+(?:\.\d+|\/\d+)?))?\b/);

  if (patternMatch) {
    const m = parseFloat(evalFraction(patternMatch[1]));
    const a = parseFloat(evalFraction(patternMatch[2]));
    const n = parseFloat(evalFraction(patternMatch[3]));
    const bedtime = patternMatch[4] ? parseFloat(evalFraction(patternMatch[4])) : 0;

    morning = { 
      take: m > 0, 
      count: patternMatch[1], 
      label: 'Morning', 
      labelHi: 'सुबह', 
      labelTe: 'ఉదయం', 
      labelMr: 'सकाळी' 
    };
    afternoon = { 
      take: a > 0, 
      count: patternMatch[2], 
      label: 'Afternoon', 
      labelHi: 'दोपहर', 
      labelTe: 'మధ్యాహ్నం', 
      labelMr: 'दुपारी' 
    };
    night = { 
      take: (n > 0 || bedtime > 0), 
      count: patternMatch[4] ? `${patternMatch[3]}+${patternMatch[4]}` : patternMatch[3], 
      label: 'Night', 
      labelHi: 'रात', 
      labelTe: 'రాత్రి', 
      labelMr: 'रात्री' 
    };
  } else {
    // 2. Named medical abbreviations (OD, BD, TDS, QID, SOS, HS)
    const lower = combined.toLowerCase();
    if (lower.includes('tds') || lower.includes('tid') || lower.includes('thrice') || lower.includes('3 times') || lower.includes('teen baar') || lower.includes('moodu sarlu')) {
      morning = { take: true, count: '1', label: 'Morning', labelHi: 'सुबह', labelTe: 'ఉదయం', labelMr: 'सकाळी' };
      afternoon = { take: true, count: '1', label: 'Afternoon', labelHi: 'दोपहर', labelTe: 'మధ్యాహ్నం', labelMr: 'दुपारी' };
      night = { take: true, count: '1', label: 'Night', labelHi: 'रात', labelTe: 'రాత్రి', labelMr: 'रात्री' };
    } else if (lower.includes('bd') || lower.includes('bid') || lower.includes('twice') || lower.includes('2 times') || lower.includes('do baar') || lower.includes('rendu sarlu')) {
      morning = { take: true, count: '1', label: 'Morning', labelHi: 'सुबह', labelTe: 'ఉదయం', labelMr: 'सकाळी' };
      afternoon = { take: false, count: '0', label: 'Afternoon', labelHi: 'दोपहर', labelTe: 'మధ్యాహ్నం', labelMr: 'दुपारी' };
      night = { take: true, count: '1', label: 'Night', labelHi: 'रात', labelTe: 'రాత్రి', labelMr: 'रात्री' };
    } else if (lower.includes('hs') || lower.includes('bedtime') || lower.includes('night only') || lower.includes('raat ko') || lower.includes('padukune mundu')) {
      morning = { take: false, count: '0', label: 'Morning', labelHi: 'सुबह', labelTe: 'ఉదయం', labelMr: 'सकाळी' };
      afternoon = { take: false, count: '0', label: 'Afternoon', labelHi: 'दोपहर', labelTe: 'మధ్యాహ్నం', labelMr: 'दुपारी' };
      night = { take: true, count: '1', label: 'Night', labelHi: 'रात', labelTe: 'రాత్రి', labelMr: 'रात्री' };
    } else if (lower.includes('od') || lower.includes('once') || lower.includes('1 time') || lower.includes('ek baar') || lower.includes('oka sari')) {
      morning = { take: true, count: '1', label: 'Morning', labelHi: 'सुबह', labelTe: 'ఉదయం', labelMr: 'सकाळी' };
      afternoon = { take: false, count: '0', label: 'Afternoon', labelHi: 'दोपहर', labelTe: 'మధ్యాహ్నం', labelMr: 'दुपारी' };
      night = { take: false, count: '0', label: 'Night', labelHi: 'रात', labelTe: 'రాత్రి', labelMr: 'रात्री' };
    } else if (lower.includes('sos') || lower.includes('prn') || lower.includes('as needed') || lower.includes('emergency') || lower.includes('avasaram unte')) {
      customInstructions = 'Take ONLY when needed in emergency/pain (అవసరం ఉన్నప్పుడు మాత్రమే తీసుకోండి / जब ज़रूरत हो)';
    }
  }

  // 3. Timing interpretation (Before / After Food)
  let timingLabel = '';
  const timingCombined = `${timingStr || ''} ${combined}`.toLowerCase();
  if (timingCombined.includes('after food') || timingCombined.includes('after meal') || timingCombined.includes('pc') || timingCombined.includes('khane ke baad') || timingCombined.includes('bhojanam tharvatha')) {
    timingLabel = 'After Food (భోజనం తర్వాత / खाने के बाद)';
  } else if (timingCombined.includes('before food') || timingCombined.includes('before meal') || timingCombined.includes('before breakfast') || timingCombined.includes('ac') || timingCombined.includes('empty stomach') || timingCombined.includes('khane se pehle') || timingCombined.includes('bhojananiki mundu')) {
    timingLabel = 'Before Food (భోజనానికి ముందు / खाने से पहले)';
  }

  // 4. Duration text formatting
  let durationLabel = '';
  if (durationStr) {
    const dLower = durationStr.toLowerCase().trim();
    if (dLower.match(/^\d+$/)) {
      durationLabel = `For ${durationStr} Days (${durationStr} రోజులు / दिन)`;
    } else if (dLower.includes('day') || dLower.includes('week') || dLower.includes('month') || dLower.includes('din') || dLower.includes('rojulu')) {
      durationLabel = `For ${durationStr}`;
    } else {
      durationLabel = `Duration: ${durationStr}`;
    }
  }

  // 5. Build Human-Readable Sentence
  let humanSummary = '';
  if (customInstructions) {
    humanSummary = customInstructions;
  } else if (morning && afternoon && night) {
    const times = [];
    if (morning.take) times.push(`Morning (${morning.count} dose)`);
    if (afternoon.take) times.push(`Afternoon (${afternoon.count} dose)`);
    if (night.take) times.push(`Night (${night.count} dose)`);

    if (times.length === 3) {
      humanSummary = `Take 3 times daily: Morning, Afternoon, and Night`;
    } else if (times.length === 2 && morning.take && night.take) {
      humanSummary = `Take 2 times daily: in Morning and at Night (Skip afternoon)`;
    } else if (times.length === 2 && morning.take && afternoon.take) {
      humanSummary = `Take 2 times daily: in Morning and Afternoon (Skip night)`;
    } else if (times.length === 2 && afternoon.take && night.take) {
      humanSummary = `Take 2 times daily: in Afternoon and at Night (Skip morning)`;
    } else if (times.length === 1 && morning.take) {
      humanSummary = `Take Once daily: in the Morning only`;
    } else if (times.length === 1 && night.take) {
      humanSummary = `Take Once daily: at Night before sleep`;
    } else if (times.length === 1 && afternoon.take) {
      humanSummary = `Take Once daily: in the Afternoon`;
    } else {
      humanSummary = `As directed by physician`;
    }

    if (timingLabel) {
      humanSummary += ` • ${timingLabel}`;
    }
    if (durationLabel) {
      humanSummary += ` • ${durationLabel}`;
    }
  } else {
    humanSummary = combined || 'Follow doctor instructions';
    if (timingLabel) humanSummary += ` • ${timingLabel}`;
    if (durationLabel) humanSummary += ` • ${durationLabel}`;
  }

  return {
    hasSlotInfo: !!(morning && afternoon && night),
    morning,
    afternoon,
    night,
    timingLabel,
    durationLabel,
    humanSummary,
  };
}

function evalFraction(str) {
  if (!str) return '0';
  if (str.includes('/')) {
    const parts = str.split('/');
    if (parts.length === 2 && parseFloat(parts[1]) !== 0) {
      return parseFloat(parts[0]) / parseFloat(parts[1]);
    }
  }
  return str;
}
