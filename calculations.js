(function (root) {
  'use strict';

  const symbols = ['V', 'I', 'R', 'P'];

  function positiveNumber(value, name) {
    const number = Number(value);
    if (!Number.isFinite(number) || number <= 0) {
      throw new Error(`${name} deve ser um número maior que zero.`);
    }
    return number;
  }

  function calculateCurrent({ power, powerUnit = 'W', voltage, powerFactor, phase = 'single' }) {
    let powerWatts = positiveNumber(power, 'Potência');
    const volts = positiveNumber(voltage, 'Tensão');
    const factor = powerFactor === undefined || powerFactor === null || powerFactor === ''
      ? 1
      : Number(powerFactor);

    if (!Number.isFinite(factor) || factor <= 0 || factor > 1) {
      throw new Error('O fator de potência deve ser maior que zero e até 1.');
    }
    if (powerUnit !== 'W' && powerUnit !== 'kW') {
      throw new Error('Selecione W ou kW para a potência.');
    }
    if (phase !== 'single' && phase !== 'three') {
      throw new Error('Selecione uma instalação mono ou trifásica.');
    }
    if (powerUnit === 'kW') powerWatts *= 1000;

    const rootThree = phase === 'three';
    const denominator = (rootThree ? Math.sqrt(3) : 1) * volts * factor;
    const current = powerWatts / denominator;
    if (!Number.isFinite(current) || current <= 0) {
      throw new Error('Não foi possível calcular a corrente com esses valores.');
    }

    const formula = rootThree ? 'I = P ÷ (√3 × V × FP)' : 'I = P ÷ (V × FP)';
    const substitution = rootThree
      ? `I = ${powerWatts} ÷ (√3 × ${volts} × ${factor})`
      : `I = ${powerWatts} ÷ (${volts} × ${factor})`;
    return { value: current, formula, substitution };
  }

  function calculateOhms(target, knownA, knownB) {
    if (!symbols.includes(target)) throw new Error('Escolha uma grandeza válida para calcular.');
    if (!knownA || !knownB || !symbols.includes(knownA.symbol) || !symbols.includes(knownB.symbol)) {
      throw new Error('Informe duas grandezas conhecidas válidas.');
    }
    if (target === knownA.symbol || target === knownB.symbol || knownA.symbol === knownB.symbol) {
      throw new Error('Escolha duas grandezas diferentes da que deseja calcular.');
    }

    const first = positiveNumber(knownA.value, `Valor de ${knownA.symbol}`);
    const second = positiveNumber(knownB.value, `Valor de ${knownB.symbol}`);
    const values = { [knownA.symbol]: first, [knownB.symbol]: second };
    const pair = [knownA.symbol, knownB.symbol].sort().join('');
    const formulaByTarget = {
      V: {
        IR: ['V = I × R', values.I * values.R],
        IP: ['V = P ÷ I', values.P / values.I],
        PR: ['V = √(P × R)', Math.sqrt(values.P * values.R)]
      },
      I: {
        PV: ['I = P ÷ V', values.P / values.V],
        PR: ['I = √(P ÷ R)', Math.sqrt(values.P / values.R)],
        RV: ['I = V ÷ R', values.V / values.R]
      },
      R: {
        IV: ['R = V ÷ I', values.V / values.I],
        IP: ['R = P ÷ I²', values.P / (values.I ** 2)],
        PV: ['R = V² ÷ P', (values.V ** 2) / values.P]
      },
      P: {
        IV: ['P = V × I', values.V * values.I],
        IR: ['P = I² × R', (values.I ** 2) * values.R],
        RV: ['P = V² ÷ R', (values.V ** 2) / values.R]
      }
    };
    const result = formulaByTarget[target][pair];
    if (!result) throw new Error('Essa combinação de grandezas não é válida.');

    const value = result[1];
    if (!Number.isFinite(value) || value <= 0) {
      throw new Error('O resultado não é um número finito para esses valores.');
    }
    const substitutions = { V: 'V', I: 'I', R: 'R', P: 'P' };
    const displayedValues = Object.entries(values).map(([symbol, number]) => `${symbol}=${number}`).join(', ');
    return { value, formula: result[0], substitution: `${displayedValues} → ${target}=${value}`, unit: substitutions[target] };
  }

  const api = { calculateCurrent, calculateOhms };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  if (root) root.AmperagemCalc = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
