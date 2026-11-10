(function () {
  'use strict';

  const { calculateCurrent, calculateOhms } = window.AmperagemCalc;
  const { calculateCableProtection } = window.AmperagemCable;
  const { calculateVoltageDrop, standardSections } = window.AmperagemVoltageDrop;
  const numberFormat = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 4 });
  const unitNames = { V: 'Tensão (V)', I: 'Corrente (I)', R: 'Resistência (R)', P: 'Potência (P)' };
  const unitSymbols = { V: 'V', I: 'A', R: 'Ω', P: 'W' };
  const currentForm = document.getElementById('current-form');
  const currentResult = document.getElementById('current-result');
  let phase = 'single';
  let lastCalculatedCurrent = null;
  let lastCalculatedPhase = null;
  let lastCalculatedVoltage = null;
  let lastSuggestedCableSection = null;

  function showError(resultElement, message) {
    resultElement.hidden = false;
    resultElement.classList.add('has-error');
    resultElement.querySelector('.result-kicker').textContent = 'VERIFIQUE OS DADOS';
    const valueElement = resultElement.querySelector('.result-value');
    const formulaElement = resultElement.querySelector('.formula-block');
    let messageElement = resultElement.querySelector('.result-message');
    const gridElement = resultElement.querySelector('.cable-result-grid');
    const ruleElement = resultElement.querySelector('.cable-rule');
    resultElement.querySelectorAll('.drop-percent, .voltage-drop-status, .drop-suggestion').forEach((item) => { item.hidden = true; });
    if (!messageElement) {
      messageElement = document.createElement('p');
      messageElement.className = 'result-message';
      resultElement.querySelector('.result-kicker').after(messageElement);
    }
    if (valueElement) valueElement.hidden = true;
    if (formulaElement) formulaElement.hidden = true;
    messageElement.textContent = message;
    messageElement.hidden = false;
    if (gridElement) gridElement.hidden = true;
    if (ruleElement) ruleElement.hidden = true;
  }

  function showResult(element) {
    element.hidden = false;
    element.classList.remove('has-error');
    const formulaElement = element.querySelector('.formula-block');
    const messageElement = element.querySelector('.result-message');
    const gridElement = element.querySelector('.cable-result-grid');
    const ruleElement = element.querySelector('.cable-rule');
    const valueElement = element.querySelector('.result-value');
    if (valueElement) valueElement.hidden = false;
    if (formulaElement) formulaElement.hidden = false;
    element.querySelectorAll('.drop-percent, .voltage-drop-status').forEach((item) => { item.hidden = false; });
    if (messageElement) messageElement.hidden = true;
    if (gridElement) gridElement.hidden = false;
    if (ruleElement) ruleElement.hidden = false;
  }

  function updateCurrentResult(result) {
    showResult(currentResult);
    currentResult.querySelector('.result-kicker').textContent = 'CORRENTE CALCULADA';
    lastCalculatedCurrent = result.value;
    lastCalculatedPhase = phase;
    lastCalculatedVoltage = document.getElementById('voltage').value;
    document.getElementById('use-calculated-current').disabled = false;
    document.getElementById('use-current-for-drop').disabled = false;
    document.getElementById('current-value').textContent = numberFormat.format(result.value);
    document.getElementById('current-formula').textContent = result.formula;
    document.getElementById('current-substitution').textContent = result.substitution;
  }

  document.querySelectorAll('[data-phase]').forEach((button) => {
    button.addEventListener('click', () => {
      phase = button.dataset.phase;
      document.querySelectorAll('[data-phase]').forEach((choice) => {
        const selected = choice === button;
        choice.classList.toggle('is-selected', selected);
        choice.setAttribute('aria-pressed', String(selected));
      });
    });
  });

  document.querySelectorAll('[data-voltage]').forEach((button) => {
    button.addEventListener('click', () => {
      document.getElementById('voltage').value = button.dataset.voltage;
      document.querySelectorAll('[data-voltage]').forEach((choice) => {
        const selected = choice === button;
        choice.classList.toggle('is-selected', selected);
        choice.setAttribute('aria-pressed', String(selected));
      });
    });
  });
  document.getElementById('voltage').addEventListener('input', (event) => {
    document.querySelectorAll('[data-voltage]').forEach((button) => {
      const selected = button.dataset.voltage === event.target.value;
      button.classList.toggle('is-selected', selected);
      button.setAttribute('aria-pressed', String(selected));
    });
  });

  currentForm.addEventListener('submit', (event) => {
    event.preventDefault();
    try {
      const powerFactorValue = document.getElementById('power-factor').value;
      const result = calculateCurrent({
        power: document.getElementById('power').value,
        powerUnit: document.getElementById('power-unit').value,
        voltage: document.getElementById('voltage').value,
        powerFactor: powerFactorValue,
        phase
      });
      updateCurrentResult(result);
    } catch (error) {
      lastCalculatedCurrent = null;
      lastCalculatedPhase = null;
      document.getElementById('use-calculated-current').disabled = true;
      document.getElementById('use-current-for-drop').disabled = true;
      showError(currentResult, error.message);
    }
  });

  let cableLoadedConductors = 2;
  const cableCurrentInput = document.getElementById('cable-current');
  const cableResult = document.getElementById('cable-result');
  const cableForm = document.getElementById('cable-form');
  const cablePhaseButtons = document.querySelectorAll('[data-cable-phase]');
  const cableNumberFormat = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 4 });

  cablePhaseButtons.forEach((button) => button.addEventListener('click', () => {
    cableLoadedConductors = button.dataset.cablePhase === 'three' ? 3 : 2;
    cablePhaseButtons.forEach((choice) => {
      const selected = choice === button;
      choice.classList.toggle('is-selected', selected);
      choice.setAttribute('aria-pressed', String(selected));
    });
  }));

  cableForm.addEventListener('submit', (event) => {
    event.preventDefault();
    try {
      const result = calculateCableProtection({
        current: cableCurrentInput.value,
        factor: document.getElementById('design-factor').value,
        method: document.getElementById('installation-method').value,
        loadedConductors: cableLoadedConductors
      });
      showResult(cableResult);
      cableResult.querySelector('.result-kicker').textContent = 'SUGESTÃO SIMPLIFICADA';
      document.getElementById('cable-design-current').textContent = `${cableNumberFormat.format(result.designCurrent)} A`;
      document.getElementById('cable-breaker').textContent = `${result.breaker} A`;
      document.getElementById('cable-section').textContent = `${cableNumberFormat.format(result.cableSection)} mm²`;
      document.getElementById('cable-ampacity').textContent = `${cableNumberFormat.format(result.cableAmpacity)} A`;
      document.getElementById('cable-rule').textContent = `Ib ${cableNumberFormat.format(result.designCurrent)} A ≤ In ${result.breaker} A ≤ Iz ${cableNumberFormat.format(result.cableAmpacity)} A · ${result.method}, ${result.loadedConductors} condutores carregados.`;
      lastSuggestedCableSection = result.cableSection;
      const suggestedSectionButton = document.getElementById('use-suggested-drop-section');
      suggestedSectionButton.disabled = false;
    } catch (error) {
      lastSuggestedCableSection = null;
      document.getElementById('use-suggested-drop-section').disabled = true;
      showError(cableResult, error.message);
    }
  });

  document.getElementById('use-current-for-drop').addEventListener('click', () => {
    if (lastCalculatedCurrent === null) return;
    document.getElementById('drop-current').value = String(lastCalculatedCurrent);
    document.getElementById('drop-voltage').value = lastCalculatedVoltage;
    setDropPhase(lastCalculatedPhase);
    document.getElementById('tab-voltage-drop').click();
    document.getElementById('drop-current').focus();
  });

  document.getElementById('use-suggested-drop-section').addEventListener('click', () => {
    if (lastSuggestedCableSection === null) return;
    document.getElementById('drop-section').value = String(lastSuggestedCableSection);
  });

  const dropSectionSelect = document.getElementById('drop-section');
  standardSections.forEach((section) => {
    const option = document.createElement('option');
    option.value = String(section);
    option.textContent = `${numberFormat.format(section)} mm²`;
    dropSectionSelect.append(option);
  });
  dropSectionSelect.value = '2.5';

  let dropPhase = 'single';
  function setDropPhase(value) {
    dropPhase = value;
    document.querySelectorAll('[data-drop-phase]').forEach((button) => {
      const selected = button.dataset.dropPhase === value;
      button.classList.toggle('is-selected', selected);
      button.setAttribute('aria-pressed', String(selected));
    });
  }
  document.querySelectorAll('[data-drop-phase]').forEach((button) => button.addEventListener('click', () => setDropPhase(button.dataset.dropPhase)));

  document.querySelectorAll('[data-drop-voltage]').forEach((button) => {
    button.addEventListener('click', () => {
      document.getElementById('drop-voltage').value = button.dataset.dropVoltage;
      document.querySelectorAll('[data-drop-voltage]').forEach((choice) => {
        const selected = choice === button;
        choice.classList.toggle('is-selected', selected);
        choice.setAttribute('aria-pressed', String(selected));
      });
    });
  });
  document.getElementById('drop-voltage').addEventListener('input', (event) => {
    document.querySelectorAll('[data-drop-voltage]').forEach((button) => {
      const selected = button.dataset.dropVoltage === event.target.value;
      button.classList.toggle('is-selected', selected);
      button.setAttribute('aria-pressed', String(selected));
    });
  });

  const voltageDropResult = document.getElementById('voltage-drop-result');
  document.getElementById('voltage-drop-form').addEventListener('submit', (event) => {
    event.preventDefault();
    try {
      const result = calculateVoltageDrop({
        current: document.getElementById('drop-current').value,
        voltage: document.getElementById('drop-voltage').value,
        length: document.getElementById('drop-length').value,
        section: dropSectionSelect.value,
        phase: dropPhase,
        powerFactor: document.getElementById('drop-power-factor').value,
        limit: document.getElementById('drop-limit').value
      });
      showResult(voltageDropResult);
      voltageDropResult.querySelector('.result-kicker').textContent = 'QUEDA DE TENSÃO ESTIMADA';
      document.getElementById('drop-value').textContent = numberFormat.format(result.deltaV);
      document.getElementById('drop-percent').textContent = `${numberFormat.format(result.percent)}% da tensão de alimentação (limite ${numberFormat.format(result.limit)}%)`;
      const status = document.getElementById('voltage-drop-status');
      status.textContent = result.passed ? 'Dentro do limite selecionado.' : 'Acima do limite selecionado.';
      status.classList.toggle('is-failing', !result.passed);
      const suggestion = document.getElementById('drop-suggestion');
      suggestion.hidden = result.passed;
      if (!result.passed) {
        suggestion.textContent = result.suggestedSection === null
          ? 'Nenhuma das seções padrão disponíveis atende ao limite informado.'
          : `Sugestão: seção mínima de ${numberFormat.format(result.suggestedSection)} mm² para atender ao limite.`;
      }
      document.getElementById('drop-formula').textContent = result.formula;
      document.getElementById('drop-substitution').textContent = result.substitution;
    } catch (error) {
      showError(voltageDropResult, error.message);
    }
  });

  document.getElementById('use-calculated-current').addEventListener('click', () => {
    cableCurrentInput.value = String(lastCalculatedCurrent);
    const threePhase = lastCalculatedPhase === 'three';
    cableLoadedConductors = threePhase ? 3 : 2;
    cablePhaseButtons.forEach((button) => {
      const selected = button.dataset.cablePhase === (threePhase ? 'three' : 'single');
      button.classList.toggle('is-selected', selected);
      button.setAttribute('aria-pressed', String(selected));
    });
    document.getElementById('tab-cable').click();
    cableForm.requestSubmit();
    cableCurrentInput.focus();
  });

  const targetSelect = document.getElementById('ohm-target');
  const aSelect = document.getElementById('known-a-symbol');
  const bSelect = document.getElementById('known-b-symbol');

  function setOptions(select, excluded, preferred) {
    const available = Object.keys(unitNames).filter((symbol) => !excluded.includes(symbol));
    select.replaceChildren(...available.map((symbol) => {
      const option = document.createElement('option');
      option.value = symbol;
      option.textContent = unitNames[symbol];
      return option;
    }));
    select.value = available.includes(preferred) ? preferred : available[0];
  }

  function refreshKnownOptions(changed) {
    const target = targetSelect.value;
    let a = aSelect.value;
    let b = bSelect.value;
    if (changed === 'target') {
      if (a === target) a = '';
      if (b === target) b = '';
    }
    if (changed === 'a') {
      if (a === b) b = '';
    } else if (changed === 'b' && a === b) {
      a = '';
    }
    setOptions(aSelect, [target], a);
    setOptions(bSelect, [target, aSelect.value], b);
  }

  targetSelect.addEventListener('change', () => refreshKnownOptions('target'));
  aSelect.addEventListener('change', () => refreshKnownOptions('a'));
  bSelect.addEventListener('change', () => refreshKnownOptions('b'));
  refreshKnownOptions('initial');

  document.getElementById('ohm-form').addEventListener('submit', (event) => {
    event.preventDefault();
    const resultElement = document.getElementById('ohm-result');
    try {
      const target = targetSelect.value;
      const result = calculateOhms(
        target,
        { symbol: aSelect.value, value: document.getElementById('known-a-value').value },
        { symbol: bSelect.value, value: document.getElementById('known-b-value').value }
      );
      showResult(resultElement);
      document.getElementById('ohm-result-label').textContent = `${unitNames[target].toLocaleUpperCase('pt-BR')} CALCULADA`;
      document.getElementById('ohm-value').textContent = numberFormat.format(result.value);
      document.getElementById('ohm-unit').textContent = unitSymbols[target];
      document.getElementById('ohm-formula').textContent = result.formula;
      document.getElementById('ohm-substitution').textContent = result.substitution;
    } catch (error) {
      showError(resultElement, error.message);
    }
  });

  const tabs = [
    { button: document.getElementById('tab-current'), panel: document.getElementById('panel-current') },
    { button: document.getElementById('tab-ohm'), panel: document.getElementById('panel-ohm') },
    { button: document.getElementById('tab-cable'), panel: document.getElementById('panel-cable') },
    { button: document.getElementById('tab-voltage-drop'), panel: document.getElementById('panel-voltage-drop') }
  ];
  tabs.forEach(({ button }) => button.addEventListener('click', () => {
    tabs.forEach(({ button: tab, panel }) => {
      const selected = tab === button;
      tab.classList.toggle('is-active', selected);
      tab.setAttribute('aria-selected', String(selected));
      panel.hidden = !selected;
    });
  }));

  let installPrompt;
  const installButton = document.getElementById('install-button');
  window.addEventListener('beforeinstallprompt', (event) => {
    event.preventDefault();
    installPrompt = event;
    installButton.hidden = false;
  });
  installButton.addEventListener('click', async () => {
    if (!installPrompt) return;
    installPrompt.prompt();
    await installPrompt.userChoice;
    installPrompt = null;
    installButton.hidden = true;
  });
  window.addEventListener('appinstalled', () => {
    installPrompt = null;
    installButton.hidden = true;
  });

  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => navigator.serviceWorker.register('./sw.js').catch(() => {}));
  }
})();
