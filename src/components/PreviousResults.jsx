import React, { useEffect, useState } from "react";

export default function PreviousResults() {
    const [result, setResult] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const tg = window.Telegram?.WebApp;
        if (!tg?.CloudStorage?.getItem) {
            setLoading(false);
            return;
        }
        tg.CloudStorage.getItem("lastResult", (value, err) => {
            setLoading(false);
            if (err || !value) return;
            try {
                setResult(JSON.parse(value));
            } catch {
                console.error("Invalid stored data");
            }
        });
    }, []);

    if (loading) return <p className="p-6">Загрузка...</p>;
    if (!result) return <p className="p-6">Нет сохранённых результатов.</p>;

    return (
        <div className="p-6 max-w-3xl mx-auto">
            <h2 className="text-xl font-bold mb-4">Прошлые результаты</h2>
            <p className="text-sm mb-3">
                Имя: <b>{result.first_name} {result.last_name}</b> · Telegram: <b>{result.telegram}</b> · Дата:{" "}
                <b>{new Date(result.finishedAt).toLocaleString()}</b>
            </p>
            <div className="overflow-x-auto">
                <table className="w-full text-sm border">
                    <thead>
                    <tr className="bg-gray-100 text-left">
                        <th className="p-2">#</th>
                        <th className="p-2">Эффект</th>
                        <th className="p-2">Картинка</th>
                        <th className="p-2">Значения</th>
                    </tr>
                    </thead>
                    <tbody>
                    {result.screens.map((s) => (
                        <tr key={s.index} className="border-t align-top">
                            <td className="p-2">{s.index + 1}</td>
                            <td className="p-2">{s.effect}</td>
                            <td className="p-2 text-xs">{s.image}</td>
                            <td className="p-2">
                                {s.values ? (
                                    <pre className="text-xs whitespace-pre-wrap bg-gray-50 p-2 rounded">
                      {JSON.stringify(s.values, null, 2)}
                    </pre>
                                ) : (
                                    <span className="text-gray-400">—</span>
                                )}
                            </td>
                        </tr>
                    ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
