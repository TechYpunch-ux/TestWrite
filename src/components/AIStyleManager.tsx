'use client';
import { useState, useEffect } from 'react';
import { useAuth } from '../lib/hooks/useAuth';
import { addDocument } from '../lib/firebase/firebaseUtils';
import { getDocs, query, collection, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { X, MoreVertical, Edit, Trash } from 'lucide-react';

const defaultStyle = {
  name: '',
  marketAwareness: 'unaware',
  marketSophistication: 'No competition',
  productName: '',
  bigProblem: '',
  bigPromise: '',
  problemMechanism: '',
  solutionMechanism: '',
  proofElements: ''
};

export default function AIStyleManager({ onStyleSelected }: {
  onStyleSelected: (styleId: string) => void
}) {
  const { user } = useAuth();
  const [showPanel, setShowPanel] = useState(false);
  const [showCreation, setShowCreation] = useState(false);
  const [styles, setStyles] = useState<any[]>([]);
  const [newStyle, setNewStyle] = useState({ ...defaultStyle });
  const [editingStyle, setEditingStyle] = useState<any | null>(null);

  useEffect(() => {
    const fetchStyles = async () => {
      if (!user) return;
      
      const stylesSnapshot = await getDocs(query(
        collection(db, 'aiStyles'),
        where('userId', '==', user.uid)
      ));
      
      setStyles(stylesSnapshot.docs.map((doc: any) => ({
        id: doc.id,
        ...doc.data()
      })));
    };

    if (user) fetchStyles();
  }, [user]);

  const handleCreateStyle = async () => {
    if (!user) return;
    
    const styleData = {
      userId: user.uid,
      ...newStyle,
      createdAt: new Date().toISOString()
    };
    
    try {
      const response = await fetch('/api/ai-style', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(styleData),
      });
      
      if (!response.ok) throw new Error('Failed to save style');
      
      const result = await response.json();
      setStyles(prev => [...prev, { id: result.id, ...styleData }]);
      setShowCreation(false);
    } catch (error) {
      console.error('Error saving style:', error);
    }
  };

  const handleUpdateStyle = async () => {
    if (!user || !editingStyle) return;

    try {
      const response = await fetch(`/api/ai-style/${editingStyle.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(editingStyle),
      });
      
      if (!response.ok) throw new Error('Failed to update style');
      
      // Refresh styles list
      const updatedStyles = styles.map(style => 
        style.id === editingStyle.id ? {...editingStyle} : style
      );
      setStyles(updatedStyles);
      
      setShowCreation(false);
      setEditingStyle(null);
    } catch (error) {
      console.error('Error updating style:', error);
    }
  };

  const handleDeleteStyle = async (id: string) => {
    if (!user) return;
    try {
      const response = await fetch(`/api/ai-style/${id}`, { method: 'DELETE' });
      if (!response.ok) throw new Error('Failed to delete style');
      setStyles(styles.filter(style => style.id !== id));
    } catch (error) {
      console.error('Error deleting style:', error);
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => setShowPanel(!showPanel)}
        className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 z-30"
      >
        AI Style
      </button>

      {showPanel && (
        <>
          <div 
            className="fixed inset-0 bg-black/50 z-40" 
            onClick={() => setShowPanel(false)}
          />
          <div className="fixed top-0 right-0 h-full w-1/2 bg-white shadow-lg p-6 overflow-y-auto border-l border-gray-200 z-50">
            {!showCreation ? (
              <>
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-lg font-semibold">Select AI Style</h3>
                  <button 
                    onClick={() => setShowPanel(false)}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    <X size={20} />
                  </button>
                </div>

                <button
                  onClick={() => setShowCreation(true)}
                  className="w-full mb-4 py-2 px-4 bg-green-500 text-white rounded hover:bg-green-600"
                >
                  Create New Style
                </button>

                <ul className="space-y-2">
                  {styles.map(style => (
                    <li
                      key={style.id}
                      className="group cursor-pointer p-2 hover:bg-gray-50 rounded flex justify-between items-center"
                    >
                      <div 
                        className="flex-1"
                        onClick={() => {
                          onStyleSelected(style.id);
                          setShowPanel(false);
                        }}
                      >
                        <div className="font-medium">{style.name}</div>
                        <div className="text-sm text-gray-500">{style.purpose}</div>
                      </div>
                      
                      <div className="relative">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingStyle(style);
                            setShowCreation(true);
                          }}
                          className="p-1 hover:bg-gray-200 rounded-full text-gray-500 hover:text-gray-700"
                        >
                          <MoreVertical size={18} />
                        </button>
                        
                        {editingStyle?.id === style.id && (
                          <div className="absolute right-0 top-6 bg-white border rounded-lg shadow-lg z-50 w-32">
                            <button
                              onClick={() => setEditingStyle(style)}
                              className="w-full p-2 flex items-center gap-2 hover:bg-gray-100 text-sm"
                            >
                              <Edit size={16} className="text-gray-600" />
                              Edit
                            </button>
                            <button
                              onClick={() => handleDeleteStyle(style.id)}
                              className="w-full p-2 flex items-center gap-2 hover:bg-gray-100 text-red-600 text-sm"
                            >
                              <Trash size={16} />
                              Delete
                            </button>
                          </div>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              </>
            ) : (
              <div className="mt-4 p-4 bg-white rounded-lg border">
                <h2 className="text-lg font-bold mb-4">
                  {editingStyle ? "Edit Style" : "Create New Style"}
                </h2>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Style Name</label>
                    <input
                      type="text"
                      value={editingStyle?.name || newStyle.name}
                      onChange={(e) => editingStyle 
                        ? setEditingStyle({...editingStyle, name: e.target.value})
                        : setNewStyle({...newStyle, name: e.target.value})}
                      className="w-full p-2 border rounded"
                      placeholder="My Writing Style"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">Market Awareness</label>
                    <select
                      value={editingStyle?.marketAwareness || newStyle.marketAwareness}
                      onChange={(e) => editingStyle
                        ? setEditingStyle({...editingStyle, marketAwareness: e.target.value})
                        : setNewStyle({...newStyle, marketAwareness: e.target.value})}
                      className="w-full p-2 border rounded"
                    >
                      <option value="unaware">Unaware</option>
                      <option value="problem aware">Problem Aware</option>
                      <option value="solution aware">Solution Aware</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">Market Sophistication</label>
                    <select
                      value={editingStyle?.marketSophistication || newStyle.marketSophistication}
                      onChange={(e) => editingStyle
                        ? setEditingStyle({...editingStyle, marketSophistication: e.target.value})
                        : setNewStyle({...newStyle, marketSophistication: e.target.value})}
                      className="w-full p-2 border rounded"
                    >
                      {['No competition', 'Some competition', 'More competition W/ specific claims', 
                        'Heavy competition W/ mechanism', 'Heavy competition W/ advanced mechanism'].map(option => (
                        <option key={option} value={option}>{option}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">Product Name</label>
                    <input
                      type="text"
                      value={editingStyle?.productName || newStyle.productName}
                      onChange={(e) => editingStyle
                        ? setEditingStyle({...editingStyle, productName: e.target.value})
                        : setNewStyle({...newStyle, productName: e.target.value})}
                      className="w-full p-2 border rounded"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">The Big Problem</label>
                    <input
                      type="text"
                      value={editingStyle?.bigProblem || newStyle.bigProblem}
                      onChange={(e) => editingStyle
                        ? setEditingStyle({...editingStyle, bigProblem: e.target.value})
                        : setNewStyle({...newStyle, bigProblem: e.target.value})}
                      className="w-full p-2 border rounded"
                      placeholder="The core problem your product solves"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">The Big Promise</label>
                    <input
                      type="text"
                      value={editingStyle?.bigPromise || newStyle.bigPromise}
                      onChange={(e) => editingStyle
                        ? setEditingStyle({...editingStyle, bigPromise: e.target.value})
                        : setNewStyle({...newStyle, bigPromise: e.target.value})}
                      className="w-full p-2 border rounded"
                      placeholder="The primary benefit your product delivers"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">Problem Mechanism</label>
                    <input
                      type="text"
                      value={editingStyle?.problemMechanism || newStyle.problemMechanism}
                      onChange={(e) => editingStyle
                        ? setEditingStyle({...editingStyle, problemMechanism: e.target.value})
                        : setNewStyle({...newStyle, problemMechanism: e.target.value})}
                      className="w-full p-2 border rounded"
                      placeholder="How the problem actually works/creates issues"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">Solution Mechanism</label>
                    <input
                      type="text"
                      value={editingStyle?.solutionMechanism || newStyle.solutionMechanism}
                      onChange={(e) => editingStyle
                        ? setEditingStyle({...editingStyle, solutionMechanism: e.target.value})
                        : setNewStyle({...newStyle, solutionMechanism: e.target.value})}
                      className="w-full p-2 border rounded"
                      placeholder="How your product specifically solves the problem"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">Proof Elements</label>
                    <input
                      type="text"
                      value={editingStyle?.proofElements || newStyle.proofElements}
                      onChange={(e) => editingStyle
                        ? setEditingStyle({...editingStyle, proofElements: e.target.value})
                        : setNewStyle({...newStyle, proofElements: e.target.value})}
                      className="w-full p-2 border rounded"
                      placeholder="Key proof points (studies, testimonials, etc)"
                    />
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={editingStyle ? handleUpdateStyle : handleCreateStyle}
                      className="flex-1 py-2 px-4 bg-blue-500 text-white rounded hover:bg-blue-600"
                    >
                      {editingStyle ? "Save Style" : "Create Style"}
                    </button>
                    <button
                      onClick={() => {
                        setShowCreation(false);
                        setEditingStyle(null);
                        setNewStyle({ ...defaultStyle });
                      }}
                      className="flex-1 py-2 px-4 bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
} 