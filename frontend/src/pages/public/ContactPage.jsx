import React, { useState } from 'react';
import Card from '../../components/common/Card';
import Input from '../../components/common/Input';
import Button from '../../components/common/Button';
import Alert from '../../components/common/Alert';
import { FaPhoneAlt, FaEnvelope, FaMapMarkerAlt, FaPaperPlane } from 'react-icons/fa';

const ContactPage = () => {
  const [submitted, setSubmitted] = useState(false);
  const [formData, setFormData] = useState({ name: '', phone: '', village: '', message: '' });

  const handleSubmit = (e) => {
    e.preventDefault();
    setSubmitted(true);
    setFormData({ name: '', phone: '', village: '', message: '' });
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-12">
      <div className="text-center space-y-3 max-w-2xl mx-auto">
        <span className="text-xs font-bold uppercase tracking-wider text-health-600 bg-health-50 px-3.5 py-1.5 rounded-full">
          Get in Touch
        </span>
        <h1 className="text-3xl font-extrabold text-slate-800">
          We Are Here to Support You
        </h1>
        <p className="text-slate-600 text-sm">
          Have questions or need assistance with medical uploads? Reach out to our community team.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
        
        {/* Contact Info */}
        <div className="lg:col-span-5 space-y-6">
          <Card className="space-y-6">
            <h3 className="text-xl font-bold text-slate-800">Direct Contacts</h3>
            
            <div className="flex items-center space-x-4 p-4 bg-health-50 rounded-2xl border border-health-100">
              <div className="w-12 h-12 rounded-xl bg-health-500 text-white flex items-center justify-center text-xl shrink-0">
                <FaPhoneAlt />
              </div>
              <div>
                <span className="text-xs font-semibold text-slate-500 uppercase">Emergency Helpline</span>
                <p className="text-lg font-bold text-slate-800">104 / 108 (Toll Free)</p>
              </div>
            </div>

            <div className="flex items-center space-x-4 p-4 bg-mint-50 rounded-2xl border border-mint-100">
              <div className="w-12 h-12 rounded-xl bg-mint-500 text-white flex items-center justify-center text-xl shrink-0">
                <FaEnvelope />
              </div>
              <div>
                <span className="text-xs font-semibold text-slate-500 uppercase">Support Email</span>
                <p className="text-sm font-bold text-slate-800">support@sevahealth.org</p>
              </div>
            </div>

            <div className="flex items-center space-x-4 p-4 bg-tealSoft-50 rounded-2xl border border-tealSoft-100">
              <div className="w-12 h-12 rounded-xl bg-tealSoft-500 text-white flex items-center justify-center text-xl shrink-0">
                <FaMapMarkerAlt />
              </div>
              <div>
                <span className="text-xs font-semibold text-slate-500 uppercase">Headquarters</span>
                <p className="text-xs font-bold text-slate-800">SevaHealth Rural Hub, Solan District, HP, India</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Message Form */}
        <div className="lg:col-span-7">
          <Card className="space-y-6">
            <h3 className="text-xl font-bold text-slate-800">Send Us a Message</h3>
            
            {submitted && (
              <Alert type="success" message="Thank you! Our rural health officer will reach out to you within 2 hours." />
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Full Name"
                  placeholder="e.g. Ramesh Kumar"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
                <Input
                  label="Phone Number"
                  placeholder="e.g. 9876543210"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  required
                />
              </div>

              <Input
                label="Village / District"
                placeholder="e.g. Sundarpur Village, Tehsil Solan"
                value={formData.village}
                onChange={(e) => setFormData({ ...formData, village: e.target.value })}
                required
              />

              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-700 tracking-wide uppercase">
                  How can we help you? *
                </label>
                <textarea
                  rows="4"
                  required
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  placeholder="Tell us what guidance you need..."
                  className="w-full p-4 text-sm rounded-2xl border border-slate-200 focus:outline-none focus:border-health-500 focus:ring-2 focus:ring-health-100"
                ></textarea>
              </div>

              <Button type="submit" variant="primary" size="lg" icon={FaPaperPlane} fullWidth>
                Submit Message
              </Button>
            </form>
          </Card>
        </div>

      </div>
    </div>
  );
};

export default ContactPage;
