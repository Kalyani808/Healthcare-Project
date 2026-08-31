import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Alert from '../../components/common/Alert';
import api from '../../api/axios';
import { 
  FaRobot, 
  FaLightbulb, 
  FaCalendarCheck, 
  FaPills, 
  FaVial, 
  FaHeartbeat, 
  FaCheckCircle, 
  FaClock, 
  FaArrowRight, 
  FaExclamationCircle, 
  FaLanguage, 
  FaCheck,
  FaShieldAlt,
  FaUserMd
} from 'react-icons/fa';

const AIRecommendations = () => {
  const [recommendations, setRecommendations] = useState(null);
  const [tips, setTips] = useState([]);
  const [followUps, setFollowUps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [completingId, setCompletingId] = useState(null);

  // Preferred Language: 'en', 'te', 'hi', 'mr'
  const [lang, setLang] = useState(() => {
    return localStorage.getItem('preferred_language') || 'en';
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [recsRes, tipsRes, fuRes] = await Promise.allSettled([
        api.get('/api/recommendations/my-recommendations/'),
        api.get('/api/recommendations/daily-tips/'),
        api.get('/api/recommendations/follow-ups/'),
      ]);

      if (recsRes.status === 'fulfilled') {
        setRecommendations(recsRes.value.data);
      }
      if (tipsRes.status === 'fulfilled') {
        setTips(tipsRes.value.data.tips || []);
      }
      if (fuRes.status === 'fulfilled') {
        const fuData = fuRes.value.data.results || fuRes.value.data;
        setFollowUps(Array.isArray(fuData) ? fuData : []);
      }
    } catch (err) {
      console.error('Failed to load recommendations:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCompleteFollowUp = async (id) => {
    setCompletingId(id);
    try {
      await api.post(`/api/recommendations/follow-ups/${id}/complete/`);
      setFollowUps(prev => prev.map(f => f.id === id ? { ...f, is_completed: true } : f));
    } catch (err) {
      console.error('Error completing follow up:', err);
    } finally {
      setCompletingId(null);
    }
  };

  const getLocalizedTip = (tip) => {
    if (lang === 'te' && tip.tip_text_te) return tip.tip_text_te;
    if (lang === 'hi' && tip.tip_text_hi) return tip.tip_text_hi;
    if (lang === 'mr' && tip.tip_text_mr) return tip.tip_text_mr;
    return tip.tip_text;
  };

  const getLocalizedInsightTitle = (insight) => {
    if (lang === 'te' && insight.title_te) return insight.title_te;
    if (lang === 'hi' && insight.title_hi) return insight.title_hi;
    if (lang === 'mr' && insight.title_mr) return insight.title_mr;
    return insight.title;
  };

  const getLocalizedInsightDesc = (insight) => {
    if (lang === 'te' && insight.description_te) return insight.description_te;
    if (lang === 'hi' && insight.description_hi) return insight.description_hi;
    if (lang === 'mr' && insight.description_mr) return insight.description_mr;
    return insight.description;
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-12">
      
      {/* 🌟 Top Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-teal-900 to-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-xl border border-teal-800/40 relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center space-x-2 bg-teal-500/20 border border-teal-400/30 px-3 py-1 rounded-full text-teal-300 text-xs font-bold uppercase tracking-wider">
              <FaRobot className="text-teal-400" />
              <span>Personalized Clinical Intelligence Engine</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
              AI Health Recommendations & Follow-Up Care
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 max-w-xl">
              Personalized dietary advice, drug-food timing protocols, and automated doctor/lab follow-up schedules.
            </p>
          </div>

          {/* Language Switcher */}
          <div className="bg-slate-800/80 border border-slate-700 p-2 rounded-2xl flex items-center space-x-1.5 shrink-0">
            <FaLanguage className="text-teal-400 text-base ml-1" />
            {[
              { code: 'te', label: 'తెలుగు' },
              { code: 'hi', label: 'हिंदी' },
              { code: 'mr', label: 'मराठी' },
              { code: 'en', label: 'English' }
            ].map(l => (
              <button
                key={l.code}
                onClick={() => {
                  setLang(l.code);
                  localStorage.setItem('preferred_language', l.code);
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all ${
                  lang === l.code
                    ? 'bg-teal-600 text-white shadow-sm'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                {l.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 2-COLUMN WORKSPACE: Personalized Insights & Daily Awareness Tips */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Column (7 Cols): Prescription & Lab Tailored Health Insights */}
        <div className="lg:col-span-7 space-y-4">
          <Card className="p-6 bg-white dark:bg-[#1E293B] border border-slate-200/80 dark:border-slate-700 shadow-md space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-700">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-xl bg-teal-600 text-white flex items-center justify-center text-sm shadow-xs">
                  <FaLightbulb />
                </div>
                <h3 className="font-extrabold text-slate-900 dark:text-slate-100 text-base">
                  Prescription-Tailored Clinical Insights
                </h3>
              </div>
              <span className="text-[10px] font-black uppercase px-2.5 py-0.5 bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 rounded-md">
                Active AI Reasoning
              </span>
            </div>

            {loading ? (
              <div className="py-12 text-center text-slate-400">Analyzing active health profiles...</div>
            ) : recommendations?.insights?.length > 0 ? (
              <div className="space-y-3.5">
                {recommendations.insights.map((insight, idx) => (
                  <div
                    key={idx}
                    className="p-4 bg-slate-50 dark:bg-slate-900/60 rounded-2xl border-l-4 border-teal-500 border-t border-r border-b border-slate-200/40 dark:border-slate-800 space-y-2 transition-all hover:shadow-xs"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-black uppercase px-2 py-0.5 bg-teal-100 text-teal-800 dark:bg-teal-950 dark:text-teal-300 rounded">
                        {insight.badge}
                      </span>
                      <span className="text-[10px] font-bold text-slate-400">
                        {insight.severity === 'important' ? '⚠️ Important Protocol' : '💡 Advisory'}
                      </span>
                    </div>

                    <h4 className="font-extrabold text-slate-900 dark:text-slate-100 text-sm">
                      {getLocalizedInsightTitle(insight)}
                    </h4>

                    <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed font-medium">
                      {getLocalizedInsightDesc(insight)}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-10 space-y-2 text-slate-400 text-xs">
                <FaPills className="text-3xl mx-auto opacity-30 text-teal-500" />
                <p className="font-bold text-slate-600 dark:text-slate-300">No active prescriptions detected.</p>
                <Link to="/patient/upload-document" className="text-teal-600 font-bold hover:underline">
                  Upload prescription to generate personalized advice
                </Link>
              </div>
            )}
          </Card>

          {/* Daily Health Awareness Tips Section */}
          <Card className="p-6 bg-white dark:bg-[#1E293B] border border-slate-200/80 dark:border-slate-700 shadow-md space-y-4">
            <div className="flex items-center space-x-2 pb-3 border-b border-slate-100 dark:border-slate-700">
              <div className="w-8 h-8 rounded-xl bg-amber-500 text-white flex items-center justify-center text-sm shadow-xs">
                <FaHeartbeat />
              </div>
              <h3 className="font-extrabold text-slate-900 dark:text-slate-100 text-base">
                Daily Health & Seasonal Awareness Tips
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {tips.map((tip) => (
                <div key={tip.id} className="p-3.5 bg-amber-50/50 dark:bg-slate-900/60 rounded-2xl border border-amber-200/60 dark:border-slate-800 space-y-1.5 flex flex-col justify-between">
                  <span className="text-[10px] font-black uppercase text-amber-700 dark:text-amber-400">
                    {tip.author_badge}
                  </span>
                  <p className="text-xs text-slate-700 dark:text-slate-300 font-medium leading-relaxed">
                    {getLocalizedTip(tip)}
                  </p>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Right Column (5 Cols): Clinical Follow-Up Scheduler */}
        <div className="lg:col-span-5 space-y-4">
          <Card className="p-6 bg-white dark:bg-[#1E293B] border border-slate-200/80 dark:border-slate-700 shadow-md space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-700">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center text-sm shadow-xs">
                  <FaCalendarCheck />
                </div>
                <h3 className="font-extrabold text-slate-900 dark:text-slate-100 text-base">
                  Recommended Follow-Ups
                </h3>
              </div>
              <Link to="/patient/appointments" className="text-xs font-bold text-teal-600 hover:underline">
                Book Consult
              </Link>
            </div>

            <div className="space-y-3">
              {followUps.length > 0 ? (
                followUps.map((fu) => (
                  <div
                    key={fu.id}
                    className={`p-3.5 rounded-2xl border transition-all space-y-2 ${
                      fu.is_completed
                        ? 'bg-slate-50 dark:bg-slate-900/30 border-slate-200 dark:border-slate-800 opacity-60'
                        : 'bg-blue-50/40 dark:bg-slate-900/60 border-blue-200/60 dark:border-slate-800'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="space-y-0.5">
                        <h4 className={`font-bold text-xs sm:text-sm ${fu.is_completed ? 'line-through text-slate-500' : 'text-slate-900 dark:text-slate-100'}`}>
                          {fu.title}
                        </h4>
                        <span className="text-[10px] text-blue-700 dark:text-blue-300 font-bold block">
                          📅 Target Date: {fu.recommended_date}
                        </span>
                      </div>

                      {fu.is_completed ? (
                        <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-black rounded uppercase">
                          ✓ Done
                        </span>
                      ) : (
                        <button
                          type="button"
                          disabled={completingId === fu.id}
                          onClick={() => handleCompleteFollowUp(fu.id)}
                          className="px-2.5 py-1 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-[10px] font-bold shadow-xs transition-all shrink-0"
                        >
                          {completingId === fu.id ? 'Saving...' : 'Mark Done'}
                        </button>
                      )}
                    </div>

                    <p className="text-[11px] text-slate-600 dark:text-slate-400 font-medium">
                      {fu.reason}
                    </p>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 space-y-2 text-slate-400 text-xs">
                  <FaCalendarCheck className="text-3xl mx-auto opacity-30 text-teal-500" />
                  <p className="font-bold text-slate-600 dark:text-slate-300">No pending follow-ups</p>
                  <p className="text-[11px]">Follow-ups will be generated automatically when prescriptions or lab tests are added.</p>
                </div>
              )}
            </div>
          </Card>
        </div>

      </div>
    </div>
  );
};

export default AIRecommendations;
