const demoForm = document.querySelector('[data-demo-form]');
const demoSubmit = document.querySelector('[data-demo-submit]');

if (demoForm && demoSubmit) {
  const openThanksPage = () => {
    if (!demoForm.reportValidity()) {
      return;
    }

    window.location.assign('grazie.html');
  };

  demoSubmit.addEventListener('click', openThanksPage);

  demoForm.addEventListener('submit', (event) => {
    event.preventDefault();
  });

  demoForm.addEventListener('keydown', (event) => {
    const isSingleLineField = event.target.matches('input:not([type="checkbox"]):not([type="radio"])');

    if (event.key !== 'Enter' || event.isComposing || !isSingleLineField) {
      return;
    }

    event.preventDefault();
    openThanksPage();
  });
}
