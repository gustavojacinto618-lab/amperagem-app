(function (root) {
  'use strict';

  const resistivity = 0.0172;
  const standardSections = [1.5, 2.5, 4, 6, 10, 16, 25, 35, 50, 70, 95, 120, 150, 185, 240, 300, 400, 500, 630];

  function positiveNumber(value, name) {
    const number = Number(value);
    if (!Number.isFinite(number) || number <= 0) {
      throw new Error(`${name} deve ser um número maior que zero.`);
    }
    return number;
  }

  function calculateVoltageDrop({ current, voltage, length, section, phase = 'single', powerFactor = '', limit = 4 }) {
    const loadCurrent = positiveNumber(current, 'Corrente');
    const volts = positiveNumber(voltage, 'Tensão');
    const oneWayLength = positiveNumber(length, 'Comprimento');
    const cableSection = positiveNumber(section, 'Seção do cabo');
    const factor = powerFactor === undefined || powerFactor === null || powerFactor === '' ? 1 : Number(powerFactor);
    const allowedDrop = Number(limit);

    if (!Number.isFinite(factor) || factor <= 0 || factor > 1) {
      throw new Error('O fator de potência deve ser maior que zero e até 1.');
    }
    if (phase !== 'single' && phase !== 'three') {
      throw new Error('Selecione uma instalação mono ou trifásica.');
    }
    if (!standardSections.includes(cableSection)) {
      throw new Error('Selecione uma seção de cabo padrão válida.');
    }
    if (![3, 4, 5].includes(allowedDrop)) {
      throw new Error('O limite de queda deve ser 3%, 4% ou 5%.');
    }

    const multiplier = phase === 'three' ? Math.sqrt(3) : 2;
    const deltaV = (multiplier * resistivity * oneWayLength * loadCurrent * factor) / cableSection;
    const percent = (deltaV / volts) * 100;
    if (!Number.isFinite(deltaV) || !Number.isFinite(percent)) {
      throw new Error('O resultado está fora do intervalo calculável.');
    }
    const suggestedSection = percent <= allowedDrop
      ? null
      : standardSections.find((candidate) => ((multiplier * resistivity * oneWayLength * loadCurrent * factor) / candidate / volts) * 100 <= allowedDrop) || null;
    const formula = phase === 'three'
      ? 'ΔV = √3 × ρ × L × I × FP ÷ S'
      : 'ΔV = 2 × ρ × L × I × FP ÷ S';
    const substitution = `ρ = ${resistivity} Ω·mm²/m; L = ${oneWayLength} m (ida); I = ${loadCurrent} A; FP = ${factor}; S = ${cableSection} mm²`;

    return {
      deltaV,
      percent,
      passed: percent <= allowedDrop,
      limit: allowedDrop,
      section: cableSection,
      suggestedSection,
      formula,
      substitution,
      phase,
      resistivity,
      powerFactor: factor
    };
  }

  const api = { calculateVoltageDrop, standardSections, resistivity };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  if (root) root.AmperagemVoltageDrop = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
