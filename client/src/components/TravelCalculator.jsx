import React, { useState } from 'react';
import { Calculator, X, Delete } from 'lucide-react';

const TravelCalculator = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [display, setDisplay] = useState('0');
  const [prevVal, setPrevVal] = useState(null);
  const [operation, setOperation] = useState(null);
  const [overwrite, setOverwrite] = useState(true);

  const handleDigit = (digit) => {
    if (overwrite) {
      setDisplay(String(digit));
      setOverwrite(false);
    } else {
      setDisplay(display === '0' ? String(digit) : display + digit);
    }
  };

  const handleDecimal = () => {
    if (overwrite) {
      setDisplay('0.');
      setOverwrite(false);
    } else if (!display.includes('.')) {
      setDisplay(display + '.');
    }
  };

  const handleOperator = (op) => {
    const current = parseFloat(display);
    if (prevVal === null) {
      setPrevVal(current);
    } else if (operation) {
      const res = calculate(prevVal, current, operation);
      setPrevVal(res);
      setDisplay(String(res));
    }
    setOperation(op);
    setOverwrite(true);
  };

  const calculate = (a, b, op) => {
    switch (op) {
      case '+': return Math.round((a + b) * 1000) / 1000;
      case '-': return Math.round((a - b) * 1000) / 1000;
      case '×': return Math.round((a * b) * 1000) / 1000;
      case '÷': return b !== 0 ? Math.round((a / b) * 1000) / 1000 : 'Error';
      default: return b;
    }
  };

  const handleEqual = () => {
    if (operation && prevVal !== null) {
      const current = parseFloat(display);
      const res = calculate(prevVal, current, operation);
      setDisplay(String(res));
      setPrevVal(null);
      setOperation(null);
      setOverwrite(true);
    }
  };

  const handleClear = () => {
    setDisplay('0');
    setPrevVal(null);
    setOperation(null);
    setOverwrite(true);
  };

  const handleBackspace = () => {
    if (display.length > 1) {
      setDisplay(display.slice(0, -1));
    } else {
      setDisplay('0');
      setOverwrite(true);
    }
  };

  return (
    <>
      {/* Floating Toggle Button */}
      <button
        type="button"
        className={`floating-calci-btn ${isOpen ? 'active' : ''}`}
        onClick={() => setIsOpen(!isOpen)}
        title="Open Quick Travel Calculator"
        aria-label="Toggle Calculator"
      >
        <Calculator size={20} />
        <span>Calc</span>
      </button>

      {/* Floating Calculator Modal / Popover */}
      {isOpen && (
        <div className="floating-calci-window" onClick={(e) => e.stopPropagation()}>
          <div className="calci-header">
            <div className="calci-title-wrap">
              <Calculator size={15} />
              <span>Travel Calculator</span>
            </div>
            <button
              type="button"
              className="calci-close-btn"
              onClick={() => setIsOpen(false)}
              aria-label="Close Calculator"
            >
              <X size={15} />
            </button>
          </div>

          <div className="calci-screen">
            <div className="calci-history">
              {prevVal !== null ? `${prevVal} ${operation || ''}` : ''}
            </div>
            <div className="calci-current">{display}</div>
          </div>

          <div className="calci-keypad">
            <button type="button" className="calci-key key-fn" onClick={handleClear}>C</button>
            <button type="button" className="calci-key key-fn" onClick={handleBackspace}><Delete size={14} /></button>
            <button type="button" className="calci-key key-fn" onClick={() => setDisplay(String(parseFloat(display) / 100))}>%</button>
            <button type="button" className="calci-key key-op" onClick={() => handleOperator('÷')}>÷</button>

            <button type="button" className="calci-key" onClick={() => handleDigit('7')}>7</button>
            <button type="button" className="calci-key" onClick={() => handleDigit('8')}>8</button>
            <button type="button" className="calci-key" onClick={() => handleDigit('9')}>9</button>
            <button type="button" className="calci-key key-op" onClick={() => handleOperator('×')}>×</button>

            <button type="button" className="calci-key" onClick={() => handleDigit('4')}>4</button>
            <button type="button" className="calci-key" onClick={() => handleDigit('5')}>5</button>
            <button type="button" className="calci-key" onClick={() => handleDigit('6')}>6</button>
            <button type="button" className="calci-key key-op" onClick={() => handleOperator('-')}>−</button>

            <button type="button" className="calci-key" onClick={() => handleDigit('1')}>1</button>
            <button type="button" className="calci-key" onClick={() => handleDigit('2')}>2</button>
            <button type="button" className="calci-key" onClick={() => handleDigit('3')}>3</button>
            <button type="button" className="calci-key key-op" onClick={() => handleOperator('+')}>+</button>

            <button type="button" className="calci-key key-zero" onClick={() => handleDigit('0')}>0</button>
            <button type="button" className="calci-key" onClick={handleDecimal}>.</button>
            <button type="button" className="calci-key key-equal" onClick={handleEqual}>=</button>
          </div>
        </div>
      )}
    </>
  );
};

export default TravelCalculator;
