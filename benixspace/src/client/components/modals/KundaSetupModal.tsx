import React, { useState, useEffect } from 'react';
import {
  X,
  Heart,
  Sparkles,
  MapPin,
  Check,
  Save,
  Users,
  Compass,
  Smile,
  ShieldCheck
} from 'lucide-react';
import { getAuthToken } from '../../services/api';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSaved: () => void;
  initialData?: any;
}

const INTERESTS_OPTIONS = [
  'Coffee Tasting',
  'Hiking & Outdoors',
  'Live Music & Acoustic',
  'Tech & Coding',
  'Art & Design',
  'Reading & Books',
  'Fitness & Gym',
  'Travel & Roadtrips',
  'Cooking & Dining',
  'Church & Choir',
  'Photography',
  'Basketball & Sports'
];

export const KundaSetupModal: React.FC<Props> = ({ isOpen, onClose, onSaved, initialData }) => {
  const [intention, setIntention] = useState<string>('serious_relationship');
  const [interestedIn, setInterestedIn] = useState<string>('everyone');
  const [minAge, setMinAge] = useState<number>(20);
  const [maxAge, setMaxAge] = useState<number>(38);
  const [city, setCity] = useState<string>('Kigali');
  const [selectedInterests, setSelectedInterests] = useState<string[]>(['Coffee Tasting', 'Hiking & Outdoors']);
  const [lifestyle, setLifestyle] = useState<string>('Active & Non-smoker');
  const [bio, setBio] = useState<string>('');
  const [saving, setSaving] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (initialData) {
      if (initialData.relationship_intention) setIntention(initialData.relationship_intention);
      if (initialData.interested_in) setInterestedIn(initialData.interested_in);
      if (initialData.min_age) setMinAge(initialData.min_age);
      if (initialData.max_age) setMaxAge(initialData.max_age);
      if (initialData.city) setCity(initialData.city);
      if (Array.isArray(initialData.interests)) setSelectedInterests(initialData.interests);
      if (initialData.lifestyle) setLifestyle(initialData.lifestyle);
      if (initialData.bio) setBio(initialData.bio);
    }
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  const toggleInterest = (tag: string) => {
    if (selectedInterests.includes(tag)) {
      setSelectedInterests(selectedInterests.filter((t) => t !== tag));
    } else {
      if (selectedInterests.length < 6) {
        setSelectedInterests([...selectedInterests, tag]);
      }
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setErrorMsg(null);

    try {
      const token = getAuthToken();
      const res = await fetch('/api/modules/kunda/setup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          relationship_intention: intention,
          interested_in: interestedIn,
          min_age: minAge,
          max_age: maxAge,
          city,
          interests: selectedInterests,
          lifestyle,
          bio
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to save match preferences');
      }

      onSaved();
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Error saving setup');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="bg-[#131926] border border-slate-800 rounded-3xl w-full max-w-lg max-h-[90vh] overflow-y-auto p-6 space-y-5 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-rose-500 to-pink-600 flex items-center justify-center text-white shadow-md">
              <Heart className="w-4 h-4 fill-white" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Smart Match Setup & Questionnaire</h3>
              <p className="text-[11px] text-slate-400">Personalize your algorithm to see highly compatible singles</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {errorMsg && (
          <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-xs text-rose-400">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSave} className="space-y-4 text-xs">
          {/* Relationship Goal */}
          <div>
            <label className="block font-semibold text-slate-300 mb-1.5">What are you looking for?</label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { id: 'serious_relationship', label: '💍 Serious Relationship' },
                { id: 'marriage', label: '💒 Marriage & Family' },
                { id: 'dating', label: '☕ Casual Dating & Fun' },
                { id: 'friendship', label: '🤝 New Friends & Network' }
              ].map((opt) => (
                <button
                  type="button"
                  key={opt.id}
                  onClick={() => setIntention(opt.id)}
                  className={`p-2.5 rounded-xl border text-left font-medium transition ${
                    intention === opt.id
                      ? 'bg-rose-600/20 border-rose-500 text-rose-300 shadow-md'
                      : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Interested in */}
          <div>
            <label className="block font-semibold text-slate-300 mb-1.5">I am interested in meeting:</label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'women', label: 'Women' },
                { id: 'men', label: 'Men' },
                { id: 'everyone', label: 'Everyone' }
              ].map((gender) => (
                <button
                  type="button"
                  key={gender.id}
                  onClick={() => setInterestedIn(gender.id)}
                  className={`py-2 px-3 rounded-xl border text-center font-medium capitalize transition ${
                    interestedIn === gender.id
                      ? 'bg-rose-600 text-white border-rose-500 shadow-md'
                      : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  {gender.label}
                </button>
              ))}
            </div>
          </div>

          {/* Age range */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-300 mb-1">Minimum Age</label>
              <input
                type="number"
                min="18"
                max="70"
                value={minAge}
                onChange={(e) => setMinAge(Number(e.target.value))}
                className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white font-mono"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-300 mb-1">Maximum Age</label>
              <input
                type="number"
                min="18"
                max="75"
                value={maxAge}
                onChange={(e) => setMaxAge(Number(e.target.value))}
                className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white font-mono"
              />
            </div>
          </div>

          {/* Location */}
          <div>
            <label className="block font-semibold text-slate-300 mb-1">Preferred City / Region</label>
            <select
              value={city}
              onChange={(e) => setCity(e.target.value)}
              className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white"
            >
              <option value="Kigali">Kigali (Nyarugenge, Gasabo, Kicukiro)</option>
              <option value="Musanze">Musanze (Northern Province)</option>
              <option value="Rubavu">Rubavu / Gisenyi (Western Province)</option>
              <option value="Huye">Huye (Southern Province)</option>
              <option value="Rwamagana">Rwamagana (Eastern Province)</option>
            </select>
          </div>

          {/* Interests Pills */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="font-semibold text-slate-300">Pick Interests & Passions (Up to 6)</label>
              <span className="text-[10px] text-rose-400 font-bold">{selectedInterests.length}/6 selected</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {INTERESTS_OPTIONS.map((tag) => {
                const isSelected = selectedInterests.includes(tag);
                return (
                  <button
                    type="button"
                    key={tag}
                    onClick={() => toggleInterest(tag)}
                    className={`px-3 py-1.5 rounded-lg text-[11px] font-medium transition ${
                      isSelected
                        ? 'bg-rose-600 text-white shadow-md'
                        : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    {isSelected ? '✓ ' : '+ '} {tag}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Short Bio */}
          <div>
            <label className="block font-semibold text-slate-300 mb-1">About You & Ideal Date</label>
            <textarea
              rows={3}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Tell matched candidates about yourself, what you love doing in Rwanda, and your favorite weekend spot..."
              className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-rose-500/50 resize-none"
            />
          </div>

          {/* Action buttons */}
          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2 bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-500 hover:to-pink-500 text-white rounded-xl font-bold flex items-center gap-1.5 shadow-lg shadow-rose-600/30 disabled:opacity-50"
            >
              <Sparkles className="w-4 h-4" />
              {saving ? 'Calculating Matches...' : 'Save & Calculate Matches'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
