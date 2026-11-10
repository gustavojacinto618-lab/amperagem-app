(function (root) {
  'use strict';

  const sections = [1.5, 2.5, 4, 6, 10, 16, 25, 35, 50, 70, 95, 120, 150, 185, 240, 300, 400, 500, 630];
  const ampacity = {
    B1: {
      2: [17.5, 24, 32, 41, 57, 76, 101, 125, 151, 192, 232, 269, 309, 353, 415, 477, 571, 656, 758],
      3: [15.5, 21, 28, 36, 50, 68, 89, 110, 134, 171, 207, 239, 275, 314, 370, 426, 510, 587, 678]
    },
    C: {
      2: [19.5, 27, 36, 46, 63, 85, 112, 138, 168, 213, 258, 299, 344, 392, 461, 530, 634, 729, 843],
      3: [17.5, 24, 32, 41, 57, 76, 96, 119, 144, 184, 223, 259, 299, 341, 403, 464, 557, 642, 743]
    },
    D: {
      2: [22, 29, 38, 47, 63, 81, 104, 125, 148, 183, 216, 246, 278, 312, 361, 408, 478, 545, 621],
      3: [18, 24, 31, 39, 52, 67, 86, 103, 122, 151, 179, 203, 230, 258, 297, 336, 394, 445, 506]
    }
  };
  const breakerRatings = [10, 16, 20, 25, 32, 40, 50, 63, 70, 80, 100, 125, 150, 175, 200];

  function positiveNumber(value, name) {
    const number = Number(value);
    if (!Number.isFinite(number) || number <= 0) {
      throw new Error(`${name} deve ser um número maior que zero.`);
    }
    return number;
  }

  function calculateCableProtection({ current, factor = 1, method = 'B1', loadedConductors = 2 }) {
    const loadCurrent = positiveNumber(current, 'Corrente');
    const designFactor = factor === '' ? 1 : Number(factor);
    if (!Number.isFinite(designFactor) || designFactor < 1) {
      throw new Error('O fator de projeto deve ser igual ou maior que 1.');
    }
    if (!Object.prototype.hasOwnProperty.call(ampacity, method)) {
      throw new Error('Selecione um método de instalação válido (B1, C ou D).');
    }
    if (loadedConductors !== 2 && loadedConductors !== 3) {
      throw new Error('Selecione 2 condutores (monofásico) ou 3 (trifásico).');
    }

    const designCurrent = loadCurrent * designFactor;
    if (!Number.isFinite(designCurrent)) {
      throw new Error('A corrente de projeto está fora do intervalo calculável.');
    }
    const breaker = breakerRatings.find((rating) => rating >= designCurrent);
    if (breaker === undefined) {
      throw new Error('Corrente de projeto acima do maior disjuntor disponível (200 A).');
    }

    const capacities = ampacity[method][loadedConductors];
    const cableIndex = capacities.findIndex((capacity) => capacity >= breaker);
    if (cableIndex === -1) {
      throw new Error('Não há seção de cabo disponível para essa corrente e instalação.');
    }

    return {
      loadCurrent,
      designCurrent,
      breaker,
      cableSection: sections[cableIndex],
      cableAmpacity: capacities[cableIndex],
      method,
      loadedConductors,
      factor: designFactor
    };
  }

  const api = { calculateCableProtection };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  if (root) root.AmperagemCable = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
