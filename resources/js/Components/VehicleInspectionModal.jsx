import React, { useState } from 'react';
import { useForm } from '@inertiajs/react';
import { X, Camera, Fuel, Gauge, AlertTriangle, ShieldCheck, Upload } from 'lucide-react';

export default function VehicleInspectionModal({ booking, type = 'pickup', onClose }) {
    const { data, setData, post, processing, errors } = useForm({
        booking_id: booking.id,
        type: type,
        fuel_bars: 8,
        odometer_reading: '',
        notes: '',
        photos: [],
    });

    const [previewUrls, setPreviewUrls] = useState([]);

    const handlePhotoChange = (e) => {
        const files = Array.from(e.target.files);
        setData('photos', files);

        const urls = files.map(file => URL.createObjectURL(file));
        setPreviewUrls(urls);
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        post(route('admin.inspections.store'), {
            onSuccess: () => {
                onClose();
            },
        });
    };

    return (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
            <div className="z-10 w-full max-w-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-2xl overflow-hidden transition-colors">
                
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50">
                    <div className="flex items-center gap-3">
                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-white font-black text-xs ${type === 'pickup' ? 'bg-blue-600' : 'bg-emerald-600'}`}>
                            {type === 'pickup' ? 'PK' : 'RT'}
                        </div>
                        <div>
                            <h3 className="text-sm font-black uppercase tracking-wider text-zinc-900 dark:text-white">
                                {type === 'pickup' ? 'Vehicle Pickup Inspection' : 'Vehicle Return Inspection'}
                            </h3>
                            <p className="text-[10px] text-zinc-500 dark:text-zinc-400 mt-0.5">
                                {booking.vehicle?.name} ({booking.vehicle?.plate_number}) — Renter: {booking.user?.name}
                            </p>
                        </div>
                    </div>
                    <button onClick={onClose} className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"><X size={18} /></button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-6 space-y-5 text-left max-h-[80vh] overflow-y-auto">
                    
                    {/* Fuel Level Selector (0 - 8 bars) */}
                    <div>
                        <label className="flex items-center justify-between text-[10px] font-black uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-2">
                            <span className="flex items-center gap-1.5"><Fuel size={14} className="text-amber-500" /> Fuel Level (Fuel Gauge Bars)</span>
                            <span className="font-extrabold text-xs text-zinc-900 dark:text-white">{data.fuel_bars} / 8 Bars ({Math.round((data.fuel_bars / 8) * 100)}%)</span>
                        </label>

                        {/* Bar Visualizer */}
                        <div className="grid grid-cols-9 gap-1 mb-2">
                            {[0, 1, 2, 3, 4, 5, 6, 7, 8].map(bar => (
                                <button
                                    key={bar}
                                    type="button"
                                    onClick={() => setData('fuel_bars', bar)}
                                    className={`h-8 rounded-lg text-xs font-black transition-all flex items-center justify-center ${
                                        data.fuel_bars >= bar
                                            ? bar <= 2 ? 'bg-rose-500 text-white' : bar <= 5 ? 'bg-amber-500 text-white' : 'bg-emerald-500 text-white'
                                            : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-400 border border-zinc-200 dark:border-zinc-700'
                                    }`}
                                >
                                    {bar}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Odometer Reading */}
                    <div>
                        <label className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-1.5">
                            <Gauge size={14} className="text-blue-500" /> Current Odometer Reading (KM)
                        </label>
                        <input
                            type="number"
                            min="0"
                            required
                            placeholder="e.g. 45280"
                            value={data.odometer_reading}
                            onChange={e => setData('odometer_reading', e.target.value)}
                            className="w-full h-10 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 px-3.5 text-xs text-zinc-900 dark:text-white font-mono focus:ring-2 focus:ring-[#FF3B30]/30 outline-none"
                        />
                        {errors.odometer_reading && <p className="text-[10px] text-rose-500 mt-1">{errors.odometer_reading}</p>}
                    </div>

                    {/* Inspection Notes & Damage Log */}
                    <div>
                        <label className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-1.5">
                            <AlertTriangle size={14} className="text-amber-500" /> Scratches, Dents, or Existing Damage Notes
                        </label>
                        <textarea
                            rows="3"
                            placeholder={type === 'pickup' ? 'Record any existing scratches, bumper dents, interior stains prior to turnover...' : 'Record any NEW scratches, dents, missing items, or dirty seats found upon return...'}
                            value={data.notes}
                            onChange={e => setData('notes', e.target.value)}
                            className="w-full p-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-xs text-zinc-900 dark:text-white focus:ring-2 focus:ring-[#FF3B30]/30 outline-none"
                        />
                    </div>

                    {/* Photo Upload Dropzone */}
                    <div>
                        <label className="flex items-center justify-between text-[10px] font-black uppercase tracking-wider text-zinc-500 dark:text-zinc-400 mb-1.5">
                            <span className="flex items-center gap-1.5"><Camera size={14} className="text-purple-500" /> Upload Inspection Photos</span>
                            <span className="text-zinc-400 font-normal">Exterior, Interior, Fuel Gauge, Damages</span>
                        </label>

                        <div className="relative border-2 border-dashed border-zinc-200 dark:border-zinc-800 hover:border-[#FF3B30] rounded-xl p-4 text-center transition-colors bg-zinc-50/50 dark:bg-zinc-950/50">
                            <input
                                type="file"
                                multiple
                                accept="image/*"
                                onChange={handlePhotoChange}
                                className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                            />
                            <div className="flex flex-col items-center gap-1">
                                <Upload size={20} className="text-zinc-400" />
                                <span className="text-xs font-bold text-zinc-700 dark:text-zinc-300">Click or drag photos here to attach</span>
                                <span className="text-[10px] text-zinc-400">Attach photos of 4 sides, interior seats, odometer/fuel gauge, & scratches</span>
                            </div>
                        </div>

                        {/* Photo Preview Grid */}
                        {previewUrls.length > 0 && (
                            <div className="grid grid-cols-4 gap-2 mt-3">
                                {previewUrls.map((url, i) => (
                                    <div key={i} className="relative aspect-video rounded-lg overflow-hidden border border-zinc-200 dark:border-zinc-800 bg-zinc-950">
                                        <img src={url} alt={`Preview ${i+1}`} className="w-full h-full object-cover" />
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Actions */}
                    <div className="flex justify-end gap-3 pt-3 border-t border-zinc-200 dark:border-zinc-800">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 h-10 border border-zinc-200 dark:border-zinc-800 rounded-xl text-xs font-bold text-zinc-500 hover:text-zinc-900 dark:hover:text-white transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={processing}
                            className="px-5 h-10 bg-[#FF3B30] hover:bg-red-700 text-white rounded-xl text-xs font-black transition-colors disabled:opacity-50"
                        >
                            {processing ? 'Saving Inspection Record...' : `Save ${type === 'pickup' ? 'Pickup' : 'Return'} Record`}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
