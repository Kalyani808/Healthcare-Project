/**
 * Multilingual Prescription Localization Helper
 * Supports English (en), Hindi (hi), Telugu (te), and Marathi (mr).
 * Downstream UI and Speech matching without altering core medical data.
 */

export const UI_LOCALIZATION = {
  en: {
    setReminder: 'Set Reminder',
    whyToTake: 'Why to Take (Purpose):',
    commonSideEffects: 'Common Side Effects:',
    noSideEffects: 'No common side effects registered. Consult your physician if you feel unwell.',
    whenToTake: 'When to Take (Rural Guidance):',
    retakePhoto: 'Retake Photo',
    confirmSave: '✓ Confirm & Save',
    saving: 'Saving...',
    clinicalFindings: 'Clinical Findings',
    audioTranscript: 'Audio Transcript',
    rawOcr: 'Raw OCR',
    prescribedMedicine: 'Prescribed Medicine',
    notSpecified: 'Not specified',
    voiceGuidance: 'Spoken Voice Guidance Sahayak',
    speaking: 'Speaking...',
    ready: 'Ready',
    listenAudio: 'Listen Audio',
    resume: 'Resume',
    pause: 'Pause',
    stop: 'Stop',
    morning: 'Morning',
    afternoon: 'Afternoon',
    night: 'Night',
    tab: 'tab',
    afterBreakfast: 'after breakfast',
    afterLunch: 'after lunch',
    afterDinner: 'after dinner',
    beforeBreakfast: 'before breakfast',
    beforeFood: 'before food',
    afterFood: 'after meal',
    asDirected: 'Take as directed by your physician.',
    skip: '0 (Skip)',
  },
  te: {
    setReminder: 'రిమైండర్ సెట్ చేయండి',
    whyToTake: 'ఎందుకు తీసుకోవాలి (ఉపయోగం / ప్రయోజనం):',
    commonSideEffects: 'సాధారణ దుష్ప్రభావాలు (Side Effects):',
    noSideEffects: 'సాధారణ దుష్ప్రభావాలు నమోదు కాలేదు. అసౌకర్యంగా ఉంటే వైద్యుడిని సంప్రదించండి.',
    whenToTake: 'ఎప్పుడు తీసుకోవాలి (గ్రామీణ మార్గదర్శకత్వం):',
    retakePhoto: 'మళ్లీ ఫోటో తీయండి',
    confirmSave: '✓ నిర్ధారించి సేవ్ చేయండి',
    saving: 'సేవ్ అవుతోంది...',
    clinicalFindings: 'వైద్య ఫలితాలు',
    audioTranscript: 'వాయిస్ గైడెన్స్ ట్రాన్స్‌క్రిప్ట్',
    rawOcr: 'రా OCR పాఠ్యం',
    prescribedMedicine: 'సిఫార్సు చేయబడిన మందు',
    notSpecified: 'పేర్కొనబడలేదు',
    voiceGuidance: 'వాయిస్ గైడెన్స్ సహాయక్',
    speaking: 'మాట్లాడుతోంది...',
    ready: 'సిద్ధంగా ఉంది',
    listenAudio: 'ఆడియో వినండి',
    resume: 'కొనసాగించు',
    pause: 'పాజ్ చేయండి',
    stop: 'ఆపండి',
    morning: 'ఉదయం',
    afternoon: 'మధ్యాహ్నం',
    night: 'రాత్రి',
    tab: 'మాత్ర',
    afterBreakfast: 'అల్పాహారం తర్వాత',
    afterLunch: 'భోజనం తర్వాత',
    afterDinner: 'రాత్రి భోజనం తర్వాత',
    beforeBreakfast: 'అల్పాహారానికి ముందు',
    beforeFood: 'భోజనానికి ముందు',
    afterFood: 'భోజనం తర్వాత',
    asDirected: 'వైద్యుల సూచన ప్రకారం వాడండి.',
    skip: '0',
  },
  hi: {
    setReminder: 'रिमाइंडर सेट करें',
    whyToTake: 'दवा क्यों लें (उपयोग / उद्देश्य):',
    commonSideEffects: 'सामान्य दुष्प्रभाव (Side Effects):',
    noSideEffects: 'कोई सामान्य दुष्प्रभाव दर्ज नहीं है। यदि असहज महसूस हो तो डॉक्टर से परामर्श लें।',
    whenToTake: 'कब लेना है (ग्रामीण मार्गदर्शन):',
    retakePhoto: 'फोटो दोबारा लें',
    confirmSave: '✓ पुष्टि करें और सहेजें',
    saving: 'सहेजा जा रहा है...',
    clinicalFindings: 'दवा विवरण',
    audioTranscript: 'ऑडियो ट्रांसक्रिप्ट',
    rawOcr: 'मूल OCR टेक्स्ट',
    prescribedMedicine: 'निर्धारित दवा',
    notSpecified: 'निर्दिष्ट नहीं',
    voiceGuidance: 'आवाज मार्गदर्शन सहायक',
    speaking: 'बोल रहा है...',
    ready: 'तैयार',
    listenAudio: 'ऑडियो सुनें',
    resume: 'पुनः चलाएं',
    pause: 'रोकें',
    stop: 'बंद करें',
    morning: 'सुबह',
    afternoon: 'दोपहर',
    night: 'रात',
    tab: 'गोली',
    afterBreakfast: 'नाश्ते के बाद',
    afterLunch: 'दोपहर खाने के बाद',
    afterDinner: 'रात के खाने के बाद',
    beforeBreakfast: 'नाश्ते से पहले',
    beforeFood: 'खाने से पहले',
    afterFood: 'खाने के बाद',
    asDirected: 'डॉक्टर के निर्देशानुसार लें।',
    skip: '0',
  },
  mr: {
    setReminder: 'रिमाइंडर सेट करा',
    whyToTake: 'औषध का घ्यावे (वापर / उद्देश):',
    commonSideEffects: 'सामान्य दुष्परिणाम (Side Effects):',
    noSideEffects: 'कोणतेही सामान्य दुष्परिणाम नोंदवलेले नाहीत. त्रास वाटल्यास डॉक्टरांचा सल्ला घ्या.',
    whenToTake: 'कधी घ्यावे (ग्रामीण मार्गदर्शन):',
    retakePhoto: 'फोटो पुन्हा घ्या',
    confirmSave: '✓ खात्री करा आणि जतन करा',
    saving: 'जतन करत आहे...',
    clinicalFindings: 'वैद्यकीय माहिती',
    audioTranscript: 'ऑडिओ उतारा',
    rawOcr: 'मूळ OCR मजकूर',
    prescribedMedicine: 'डॉक्टरांनी दिलेले औषध',
    notSpecified: 'नमूद नाही',
    voiceGuidance: 'व्हॉइस मार्गदर्शन सहाय्यक',
    speaking: 'बोलत आहे...',
    ready: 'तयार',
    listenAudio: 'ऑडिओ ऐका',
    resume: 'पुढे सुरू करा',
    pause: 'विराम द्या',
    stop: 'थांबवा',
    morning: 'सकाळी',
    afternoon: 'दुपारी',
    night: 'रात्री',
    tab: 'गोळी',
    afterBreakfast: 'नाश्त्यानंतर',
    afterLunch: 'दुपारच्या जेवणानंतर',
    afterDinner: 'रात्रीच्या जेवणानंतर',
    beforeBreakfast: 'नाश्त्यापूर्वी',
    beforeFood: 'जेवणापूर्वी',
    afterFood: 'जेवणानंतर',
    asDirected: 'डॉक्टरांच्या सल्ल्यानुसार घ्या.',
    skip: '0',
  }
};

/**
 * Extract normalized language key ('en', 'hi', 'te', 'mr') from lang string (e.g. 'te-IN')
 */
export function normalizeLangKey(lang) {
  if (!lang) return 'en';
  const l = lang.toLowerCase();
  if (l.startsWith('te')) return 'te';
  if (l.startsWith('hi')) return 'hi';
  if (l.startsWith('mr')) return 'mr';
  return 'en';
}

/**
 * Get translated UI string
 */
export function getLocalizedUiString(key, lang) {
  const langKey = normalizeLangKey(lang);
  const dict = UI_LOCALIZATION[langKey] || UI_LOCALIZATION.en;
  return dict[key] || UI_LOCALIZATION.en[key] || '';
}

/**
 * Get localized medicine purpose/usage
 */
export function getLocalizedMedicinePurpose(med, lang) {
  const langKey = normalizeLangKey(lang);
  if (!med) return '';
  if (langKey === 'te' && med.usage_te) return med.usage_te;
  if (langKey === 'hi' && med.usage_hi) return med.usage_hi;
  if (langKey === 'mr' && med.usage_mr) return med.usage_mr;
  return med.usage || med.info || getLocalizedUiString('asDirected', langKey);
}

/**
 * Get localized side effects
 */
export function getLocalizedSideEffects(med, lang) {
  const langKey = normalizeLangKey(lang);
  if (!med) return getLocalizedUiString('noSideEffects', langKey);
  if (langKey === 'te' && med.side_effects_te) return med.side_effects_te;
  if (langKey === 'hi' && med.side_effects_hi) return med.side_effects_hi;
  if (langKey === 'mr' && med.side_effects_mr) return med.side_effects_mr;
  return med.side_effects || getLocalizedUiString('noSideEffects', langKey);
}

/**
 * Generate human-friendly schedule summary in target language
 */
export function getLocalizedScheduleSummary(dosageInfo, lang) {
  const langKey = normalizeLangKey(lang);
  if (!dosageInfo?.hasSlotInfo || (!dosageInfo?.morning && !dosageInfo?.afternoon && !dosageInfo?.night)) {
    return dosageInfo?.humanSummary || getLocalizedUiString('asDirected', langKey);
  }

  const { morning, afternoon, night } = dosageInfo;
  const m = !!morning?.take;
  const a = !!afternoon?.take;
  const n = !!night?.take;

  if (langKey === 'te') {
    if (m && a && n) return 'రోజుకు 3 సార్లు తీసుకోండి: ఉదయం, మధ్యాహ్నం మరియు రాత్రి';
    if (m && n && !a) return 'రోజుకు 2 సార్లు తీసుకోండి: ఉదయం మరియు రాత్రి (మధ్యాహ్నం అవసరం లేదు)';
    if (m && a && !n) return 'రోజుకు 2 సార్లు తీసుకోండి: ఉదయం మరియు మధ్యాహ్నం (రాత్రి అవసరం లేదు)';
    if (a && n && !m) return 'రోజుకు 2 సార్లు తీసుకోండి: మధ్యాహ్నం మరియు రాత్రి (ఉదయం అవసరం లేదు)';
    if (m && !a && !n) return 'రోజుకు ఒకసారి మాత్రమే: ఉదయం పూట తీసుకోండి';
    if (n && !m && !a) return 'రోజుకు ఒకసారి మాత్రమే: రాత్రి పడుకునే ముందు తీసుకోండి';
    if (a && !m && !n) return 'రోజుకు ఒకసారి మాత్రమే: మధ్యాహ్నం పూట తీసుకోండి';
    return 'వైద్యుల సూచన ప్రకారం తీసుకోండి';
  }

  if (langKey === 'hi') {
    if (m && a && n) return 'दिन में 3 बार लें: सुबह, दोपहर और रात को';
    if (m && n && !a) return 'दिन में 2 बार लें: सुबह और रात को (दोपहर में न लें)';
    if (m && a && !n) return 'दिन में 2 बार लें: सुबह और दोपहर को (रात को न लें)';
    if (a && n && !m) return 'दिन में 2 बार लें: दोपहर और रात को (सुबह न लें)';
    if (m && !a && !n) return 'दिन में एक बार: केवल सुबह के समय लें';
    if (n && !m && !a) return 'दिन में एक बार: रात को सोने से पहले लें';
    if (a && !m && !n) return 'दिन में एक बार: दोपहर के समय लें';
    return 'डॉक्टर के निर्देशानुसार लें';
  }

  if (langKey === 'mr') {
    if (m && a && n) return 'दिवसातून 3 वेळा घ्या: सकाळी, दुपारी आणि रात्री';
    if (m && n && !a) return 'दिवसातून 2 वेळा घ्या: सकाळी आणि रात्री (दुपारी घेऊ नका)';
    if (m && a && !n) return 'दिवसातून 2 वेळा घ्या: सकाळी आणि दुपारी (रात्री घेऊ नका)';
    if (a && n && !m) return 'दिवसातून 2 वेळा घ्या: दुपारी आणि रात्री (सकाळी घेऊ नका)';
    if (m && !a && !n) return 'दिवसातून एकदा: फक्त सकाळी घ्या';
    if (n && !m && !a) return 'दिवसातून एकदा: रात्री झोपण्यापूर्वी घ्या';
    if (a && !m && !n) return 'दिवसातून एकदा: दुपारी घ्या';
    return 'डॉक्टरांच्या सल्ल्यानुसार घ्या';
  }

  // English fallback
  if (m && a && n) return 'Take 3 times daily: in Morning, Afternoon, and Night';
  if (m && n && !a) return 'Take 2 times daily: in Morning and at Night (Skip afternoon)';
  if (m && a && !n) return 'Take 2 times daily: in Morning and Afternoon (Skip night)';
  if (a && n && !m) return 'Take 2 times daily: in Afternoon and at Night (Skip morning)';
  if (m && !a && !n) return 'Take Once daily: in the Morning only';
  if (n && !m && !a) return 'Take Once daily: at Night before sleep';
  if (a && !m && !n) return 'Take Once daily: in the Afternoon';
  return 'Take as directed by your physician';
}

/**
 * Generate rural plain-language guidance sentence in target language
 */
export function getLocalizedRuralGuidance(dosageInfo, med, lang) {
  const langKey = normalizeLangKey(lang);
  const timingStr = (med?.timing || '').toLowerCase();
  
  const isBefore = timingStr.includes('before') || timingStr.includes('empty');
  
  if (!dosageInfo?.hasSlotInfo) {
    return getLocalizedUiString('asDirected', langKey);
  }

  const { morning, afternoon, night } = dosageInfo;
  const m = !!morning?.take;
  const a = !!afternoon?.take;
  const n = !!night?.take;
  const mCount = morning?.count || '1';
  const aCount = afternoon?.count || '1';
  const nCount = night?.count || '1';

  if (langKey === 'te') {
    const mTiming = isBefore ? 'అల్పాహారానికి ముందు' : 'అల్పాహారం తర్వాత';
    const aTiming = isBefore ? 'భోజనానికి ముందు' : 'మధ్యాహ్న భోజనం తర్వాత';
    const nTiming = isBefore ? 'రాత్రి భోజనానికి ముందు' : 'రాత్రి భోజనం తర్వాత';

    const parts = [];
    if (m) parts.push(`ఉదయం ${mTiming} ${mCount} మాత్ర`);
    if (a) parts.push(`మధ్యాహ్నం ${aTiming} ${aCount} మాత్ర`);
    if (n) parts.push(`రాత్రి ${nTiming} ${nCount} మాత్ర`);

    const times = parts.length === 1 ? '1 సారి' : `${parts.length} సార్లు`;
    return `రోజుకు ${times} తీసుకోండి: ${parts.join(' మరియు ')}.`;
  }

  if (langKey === 'hi') {
    const mTiming = isBefore ? 'नाश्ते से पहले' : 'नाश्ते के बाद';
    const aTiming = isBefore ? 'खाने से पहले' : 'दोपहर के खाने के बाद';
    const nTiming = isBefore ? 'रात के खाने से पहले' : 'रात के खाने के बाद';

    const parts = [];
    if (m) parts.push(`सुबह ${mTiming} ${mCount} गोली`);
    if (a) parts.push(`दोपहर ${aTiming} ${aCount} गोली`);
    if (n) parts.push(`रात को ${nTiming} ${nCount} गोली`);

    const times = parts.length === 1 ? '1 बार' : `${parts.length} बार`;
    return `दिन में ${times} लें: ${parts.join(' और ')}।`;
  }

  if (langKey === 'mr') {
    const mTiming = isBefore ? 'नाश्त्यापूर्वी' : 'नाश्त्यानंतर';
    const aTiming = isBefore ? 'जेवणापूर्वी' : 'दुपारच्या जेवणानंतर';
    const nTiming = isBefore ? 'रात्रीच्या जेवणापूर्वी' : 'रात्रीच्या जेवणानंतर';

    const parts = [];
    if (m) parts.push(`सकाळी ${mTiming} ${mCount} गोळी`);
    if (a) parts.push(`दुपारी ${aTiming} ${aCount} गोळी`);
    if (n) parts.push(`रात्री ${nTiming} ${nCount} गोळी`);

    const times = parts.length === 1 ? '1 वेळा' : `${parts.length} वेळा`;
    return `दिवसातून ${times} घ्या: ${parts.join(' आणि ')}.`;
  }

  // English fallback
  const mTiming = isBefore ? 'before breakfast' : 'after breakfast';
  const aTiming = isBefore ? 'before lunch' : 'after lunch';
  const nTiming = isBefore ? 'before dinner' : 'after dinner';

  const parts = [];
  if (m) parts.push(`${mCount} tablet in the morning ${mTiming}`);
  if (a) parts.push(`${aCount} tablet in the afternoon ${aTiming}`);
  if (n) parts.push(`${nCount} tablet at night ${nTiming}`);

  const times = parts.length === 1 ? '1 time' : `${parts.length} times`;
  return `Take ${times} daily: ${parts.join(' and ')}.`;
}

/**
 * Get localized labels for the 3 time slot pill buttons
 */
export function getLocalizedSlotPillLabels(dosageInfo, med, lang) {
  const langKey = normalizeLangKey(lang);
  const timingStr = (med?.timing || '').toLowerCase();
  const isBefore = timingStr.includes('before') || timingStr.includes('empty');

  const { morning, afternoon, night } = dosageInfo || {};
  const mCount = morning?.count || '1';
  const aCount = afternoon?.count || '1';
  const nCount = night?.count || '1';

  if (langKey === 'te') {
    return {
      morningActive: `ఉదయం (${mCount} మాత్ర ${isBefore ? 'అల్పాహారానికి ముందు' : 'అల్పాహారం తర్వాత'})`,
      morningInactive: `ఉదయం (0)`,
      afternoonActive: `మధ్యాహ్నం (${aCount} మాత్ర)`,
      afternoonInactive: `మధ్యాహ్నం (0)`,
      nightActive: `రాత్రి (${nCount} మాత్ర ${isBefore ? 'భోజనానికి ముందు' : 'రాత్రి భోజనం తర్వాత'})`,
      nightInactive: `రాత్రి (0)`
    };
  }

  if (langKey === 'hi') {
    return {
      morningActive: `सुबह (${mCount} गोली ${isBefore ? 'नाश्ते से पहले' : 'नाश्ते के बाद'})`,
      morningInactive: `सुबह (0)`,
      afternoonActive: `दोपहर (${aCount} गोली)`,
      afternoonInactive: `दोपहर (0)`,
      nightActive: `रात (${nCount} गोली ${isBefore ? 'खाने से पहले' : 'रात के खाने के बाद'})`,
      nightInactive: `रात (0)`
    };
  }

  if (langKey === 'mr') {
    return {
      morningActive: `सकाळी (${mCount} गोळी ${isBefore ? 'नाश्त्यापूर्वी' : 'नाश्त्यानंतर'})`,
      morningInactive: `सकाळी (0)`,
      afternoonActive: `दुपारी (${aCount} गोळी)`,
      afternoonInactive: `दुपारी (0)`,
      nightActive: `रात्री (${nCount} गोळी ${isBefore ? 'जेवणापूर्वी' : 'जेवणानंतर'})`,
      nightInactive: `रात्री (0)`
    };
  }

  // English
  return {
    morningActive: `Morning (${mCount} tab ${isBefore ? 'before breakfast' : 'after breakfast'})`,
    morningInactive: `Morning (0)`,
    afternoonActive: `Afternoon (${aCount} tab)`,
    afternoonInactive: `Afternoon (0)`,
    nightActive: `Night (${nCount} tab ${isBefore ? 'before dinner' : 'after dinner'})`,
    nightInactive: `Night (0)`
  };
}
