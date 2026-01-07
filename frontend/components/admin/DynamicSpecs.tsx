"use client";
import { Plus, X } from "lucide-react";

interface Spec {
    title: string;
    value: string;
}

interface DynamicSpecsProps {
    specs: Spec[];
    onChange: (specs: Spec[]) => void;
}

export default function DynamicSpecs({ specs, onChange }: DynamicSpecsProps) {
    const addSpec = () => {
        onChange([...specs, { title: '', value: '' }]);
    };

    const removeSpec = (idx: number) => {
        onChange(specs.filter((_, i) => i !== idx));
    };

    const updateSpec = (idx: number, field: 'title' | 'value', value: string) => {
        const newSpecs = [...specs];
        newSpecs[idx] = { ...newSpecs[idx], [field]: value };
        onChange(newSpecs);
    };

    return (
        <div className="col-span-2 border-t pt-4 mt-2">
            <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-[#21246b]">Thông tin sản phẩm</h3>
                <button
                    type="button"
                    onClick={addSpec}
                    className="flex items-center gap-1 px-3 py-1 bg-[#21246b] text-white rounded text-sm hover:bg-[#1a1d55]"
                >
                    <Plus className="h-4 w-4" /> Thêm thông số
                </button>
            </div>
            <div className="space-y-3">
                {specs.map((spec, idx) => (
                    <div key={idx} className="flex gap-2 items-start">
                        <div className="flex-1">
                            <input
                                value={spec.title}
                                onChange={e => updateSpec(idx, 'title', e.target.value)}
                                className="w-full px-3 py-2 border rounded text-slate-600 font-normal"
                                placeholder="Tiêu đề (VD: Kích thước)"
                            />
                        </div>
                        <div className="flex-1">
                            <input
                                value={spec.value}
                                onChange={e => updateSpec(idx, 'value', e.target.value)}
                                className="w-full px-3 py-2 border rounded text-slate-600 font-normal"
                                placeholder="Giá trị (VD: 600x400mm)"
                            />
                        </div>
                        {specs.length > 1 && (
                            <button
                                type="button"
                                onClick={() => removeSpec(idx)}
                                className="p-2 text-red-500 hover:bg-red-50 rounded"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
}
