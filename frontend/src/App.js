import React, { useState, useRef } from 'react';
import axios from 'axios';
import { Bar, Pie } from 'react-chartjs-2';
import 'chart.js/auto';
import { Chart } from 'chart.js';
import { saveAs } from 'file-saver';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

export default function App() {
  const [file, setFile] = useState(null);
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedTag, setSelectedTag] = useState('All');
  const [chartType, setChartType] = useState('bar');
  const chartRef = useRef(null);

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  const handleUpload = async () => {
    if (!file) return alert("Please select a CSV file first");

    const formData = new FormData();
    formData.append('file', file);

    setLoading(true);
    try {
      const res = await axios.post('http://localhost:5000/predict', formData);
      setData(res.data);
    } catch (err) {
      console.error(err);
      alert("Upload failed or invalid file format.");
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = () => {
    const csvRows = ["Abstract,Predicted Tags"];
    data.forEach(row => {
      const line = `"${row.ABSTRACT.replace(/"/g, '""')}","${row.Predicted_Tags.join(', ')}"`;
      csvRows.push(line);
    });
    const blob = new Blob([csvRows.join("\n")], { type: 'text/csv' });
    saveAs(blob, 'predictions.csv');
  };

  const handleExportChart = async () => {
    const chartCanvas = chartRef.current.canvas;
    const canvasImage = await html2canvas(chartCanvas);
    const imgData = canvasImage.toDataURL('image/png');
    const pdf = new jsPDF();
    pdf.addImage(imgData, 'PNG', 10, 10, 190, 100);
    pdf.save('tag-distribution-chart.pdf');
  };

  const allTags = [...new Set(data.flatMap(row => row.Predicted_Tags))];
  const filteredData = selectedTag === 'All' ? data : data.filter(row => row.Predicted_Tags.includes(selectedTag));
  const tagFrequency = allTags.reduce((acc, tag) => {
    acc[tag] = data.filter(row => row.Predicted_Tags.includes(tag)).length;
    return acc;
  }, {});

  const chartData = {
    labels: Object.keys(tagFrequency),
    datasets: [
      {
        label: 'Tag Frequency',
        data: Object.values(tagFrequency),
        backgroundColor: Object.keys(tagFrequency).map((_, i) => `hsl(${(i * 47) % 360}, 70%, 60%)`),
        borderColor: 'rgba(0, 0, 0, 0.1)',
        borderWidth: 1,
      },
    ],
  };

  const chartOptions = {
    animation: {
      duration: 1000,
      easing: 'easeOutBounce'
    },
    plugins: {
      tooltip: {
        callbacks: {
          label: function (context) {
            return ` ${context.label}: ${context.formattedValue}`;
          }
        }
      },
      legend: {
        display: chartType === 'pie'
      }
    },
    responsive: true,
    scales: chartType === 'bar' ? {
      y: {
        beginAtZero: true
      }
    } : {}
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#121212', color: '#ffffff', padding: '20px' }}>
      <div style={{ backgroundColor: '#1e1e1e', padding: '30px', borderRadius: '10px', maxWidth: '1000px', margin: '0 auto', boxShadow: '0 2px 10px rgba(0,0,0,0.5)' }}>
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '20px' }}>
          <img src="/logo192.png" alt="Logo" style={{ width: '50px', height: '50px', marginRight: '10px' }} />
          <h1 style={{ fontSize: '28px', fontWeight: 'bold', color: '#ffffff' }}>Article Tag Predictor</h1>
        </div>

        <input type="file" accept=".csv" onChange={handleFileChange} style={{ marginBottom: '10px' }} />
        <div style={{ display: 'flex', gap: '10px', marginTop: '10px', marginBottom: '20px', flexWrap: 'wrap' }}>
          <button onClick={handleUpload} style={{ backgroundColor: '#007bff', color: 'white', padding: '10px 15px', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>Predict Tags</button>
          <button onClick={handleDownload} style={{ backgroundColor: '#28a745', color: 'white', padding: '10px 15px', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>Download CSV</button>
          <button onClick={handleExportChart} style={{ backgroundColor: '#ffc107', color: 'black', padding: '10px 15px', border: 'none', borderRadius: '5px', cursor: 'pointer' }}>Export Chart (PDF)</button>
          <select value={chartType} onChange={(e) => setChartType(e.target.value)} style={{ padding: '10px', borderRadius: '5px' }}>
            <option value="bar">Bar Chart</option>
            <option value="pie">Pie Chart</option>
          </select>
        </div>

        {loading && <p>Processing...</p>}

        {data.length > 0 && (
          <>
            <div style={{ marginBottom: '20px' }}>
              <label htmlFor="tagFilter">Filter by Tag: </label>
              <select id="tagFilter" value={selectedTag} onChange={(e) => setSelectedTag(e.target.value)}>
                <option value="All">All</option>
                {allTags.map(tag => (
                  <option key={tag} value={tag}>{tag}</option>
                ))}
              </select>
            </div>

            <div style={{ marginBottom: '40px' }}>
              {chartType === 'bar' ? (
                <Bar ref={chartRef} data={chartData} options={chartOptions} />
              ) : (
                <Pie ref={chartRef} data={chartData} options={chartOptions} />
              )}
            </div>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '15px', marginBottom: '30px' }}>
              {Object.entries(tagFrequency).map(([tag, freq]) => (
                <div key={tag} style={{ backgroundColor: '#292929', color: '#fff', padding: '10px 15px', borderRadius: '8px', minWidth: '120px' }}>
                  <strong>{tag}</strong>: {freq}
                </div>
              ))}
            </div>

            <table style={{ width: '100%', borderCollapse: 'collapse', backgroundColor: '#2b2b2b' }}>
              <thead>
                <tr>
                  <th style={{ border: '1px solid #555', padding: '8px', textAlign: 'left', color: '#000' }}>Abstract</th>
                  <th style={{ border: '1px solid #555', padding: '8px', textAlign: 'left', color: '#000' }}>Predicted Tags</th>
                </tr>
              </thead>
              <tbody>
                {filteredData.map((row, idx) => (
                  <tr key={idx} style={{ backgroundColor: '#2b2b2b' }}>
                    <td style={{ border: '1px solid #555', padding: '8px', color: '#ccc' }}>{row.ABSTRACT}</td>
                    <td style={{ border: '1px solid #555', padding: '8px', color: '#ccc' }}>{row.Predicted_Tags.join(", ")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </>
        )}
      </div>
    </div>
  );
}
