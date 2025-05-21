import React, { useState } from 'react';

export default function Home() {
  const [sujet, setSujet] = useState('');
  const [domaine, setDomaine] = useState('');
  const [niveau, setNiveau] = useState('');
  const [result, setResult] = useState('');

  const handleSubmit = async () => {
    const res = await fetch('/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sujet, domaine, niveau })
    });
    const data = await res.json();
    setResult(data.content);
  };

  return (
    <div className="p-8">
      <h1 className="text-2xl mb-4">Générateur de mémoire IA</h1>
      <input className="border p-2 mb-2 w-full" placeholder="Sujet" onChange={e => setSujet(e.target.value)} />
      <input className="border p-2 mb-2 w-full" placeholder="Domaine" onChange={e => setDomaine(e.target.value)} />
      <input className="border p-2 mb-2 w-full" placeholder="Niveau" onChange={e => setNiveau(e.target.value)} />
      <button onClick={handleSubmit} className="bg-blue-500 text-white p-2">Générer</button>
      <pre className="mt-4 whitespace-pre-wrap bg-gray-100 p-4">{result}</pre>
    </div>
  );
}