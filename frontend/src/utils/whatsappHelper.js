/**
 * WhatsApp Helper Utilities for Seva Health Platform
 * Supports 1-Click WhatsApp sharing for medication schedules, emergency SOS broadcasts,
 * prescription summaries, and visual pill identification.
 */

/**
 * Open WhatsApp with formatted text payload
 * @param {string} text - Message body
 * @param {string} phone - Optional phone number (with country code e.g. 91XXXXXXXXXX)
 */
export const openWhatsApp = (text, phone = '') => {
  const cleanPhone = phone ? phone.replace(/[^0-9]/g, '') : '';
  const encodedText = encodeURIComponent(text.trim());
  
  const url = cleanPhone
    ? `https://wa.me/${cleanPhone}?text=${encodedText}`
    : `https://wa.me/?text=${encodedText}`;

  window.open(url, '_blank', 'noopener,noreferrer');
};

/**
 * 1-Click Share Today's Medication Schedule on WhatsApp
 */
export const shareScheduleOnWhatsApp = (todaySchedule, userName = 'Patient', caregiverPhone = '') => {
  let message = `🏥 *Seva Health - Daily Medication Schedule* 🏥\n`;
  message += `👤 *Patient:* ${userName}\n`;
  message += `📅 *Date:* ${new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'short' })}\n`;
  message += `━━━━━━━━━━━━━━━━━━━━━\n\n`;

  if (todaySchedule?.slots) {
    const slotIcons = { morning: '☀️', afternoon: '🌤️', night: '🌙' };
    let hasItems = false;

    ['morning', 'afternoon', 'night'].forEach((slotKey) => {
      const slot = todaySchedule.slots[slotKey];
      if (slot && slot.items && slot.items.length > 0) {
        hasItems = true;
        message += `${slotIcons[slotKey] || '⏰'} *${slot.label.toUpperCase()} (${slot.time})*\n`;
        slot.items.forEach((item) => {
          const statusIcon = item.status === 'taken' ? '✅' : '🕒';
          message += `   ${statusIcon} *${item.medicine_name}* (${item.dosage || '1 tab'}) - ${item.food_timing?.replace('_', ' ') || 'as directed'}\n`;
        });
        message += `\n`;
      }
    });

    if (!hasItems) {
      message += `✨ No scheduled doses for today.\n\n`;
    }
  } else {
    message += `💊 Active prescribed medicines schedule.\n\n`;
  }

  const adherence = todaySchedule?.adherence_pct ?? 100;
  message += `📊 *Adherence Rate:* ${adherence}%\n`;
  message += `━━━━━━━━━━━━━━━━━━━━━\n`;
  message += `🌐 *Sent via Seva Health Portal* (http://localhost:3000)`;

  openWhatsApp(message, caregiverPhone);
};

/**
 * 1-Click Send Emergency SOS Alert to Family / Caregivers on WhatsApp
 */
export const sendEmergencySOSWhatsApp = (userName = 'Patient', bloodGroup = 'O+', emergencyContacts = '', caregiverPhone = '') => {
  let message = `🚨 *URGENT MEDICAL SOS ALERT - SEVA HEALTH* 🚨\n`;
  message += `⚠️ *Emergency assistance required immediately!* ⚠️\n\n`;
  message += `👤 *Patient Name:* ${userName}\n`;
  message += `🩸 *Blood Group:* ${bloodGroup}\n`;
  message += `⏰ *Alert Time:* ${new Date().toLocaleTimeString('en-IN')}\n`;
  message += `📍 *Current Status:* Triggered 108 Emergency Speed Dial\n\n`;
  message += `📞 *Emergency Contact Dialed:* 108 (National Ambulance Helpline)\n`;
  message += `━━━━━━━━━━━━━━━━━━━━━\n`;
  message += `⚠️ *Please contact the patient or dispatch assistance immediately!*`;

  openWhatsApp(message, caregiverPhone);
};

/**
 * 1-Click Share Prescription Summary on WhatsApp
 */
export const sharePrescriptionOnWhatsApp = (medicines = [], docName = 'Doctor Prescription', caregiverPhone = '') => {
  let message = `📋 *Seva Health - Prescription Summary* 📋\n`;
  message += `📁 *Document:* ${docName}\n`;
  message += `📅 *Date:* ${new Date().toLocaleDateString('en-IN')}\n`;
  message += `━━━━━━━━━━━━━━━━━━━━━\n\n`;

  if (medicines.length > 0) {
    message += `💊 *Prescribed Medications:*\n`;
    medicines.forEach((med, idx) => {
      message += `${idx + 1}. *${med.name || med.medicine_name}* (${med.dosage || med.strength || '1 tab'})\n`;
      message += `   ⏰ Timing: ${med.frequency || '1-0-1'} | ${med.timing || med.food_timing || 'After food'}\n`;
      if (med.category) message += `   🏷️ Category: ${med.category}\n`;
    });
    message += `\n`;
  }

  message += `━━━━━━━━━━━━━━━━━━━━━\n`;
  message += `🌐 *Sent via Seva Health Universal Document Analyzer*`;

  openWhatsApp(message, caregiverPhone);
};

/**
 * 1-Click Share Identified Pill on WhatsApp
 */
export const sharePillOnWhatsApp = (pillData, caregiverPhone = '') => {
  let message = `💊 *Seva Health - Identified Pill Information* 💊\n`;
  message += `━━━━━━━━━━━━━━━━━━━━━\n`;
  message += `🏷️ *Medicine Name:* ${pillData.name || 'Identified Tablet'}\n`;
  message += `🧬 *Active Generic:* ${pillData.generic || 'N/A'}\n`;
  message += `📋 *Category:* ${pillData.category || 'Therapeutic'}\n`;
  message += `⏰ *Dosage & Food Rule:* ${pillData.dosage_timing || 'As directed'}\n\n`;

  if (pillData.uses && pillData.uses.length > 0) {
    message += `🎯 *Primary Uses:*\n`;
    pillData.uses.slice(0, 3).forEach((u) => {
      message += `• ${u}\n`;
    });
    message += `\n`;
  }

  message += `━━━━━━━━━━━━━━━━━━━━━\n`;
  message += `🌐 *Identified via Seva Health Visual Pill Scanner*`;

  openWhatsApp(message, caregiverPhone);
};
