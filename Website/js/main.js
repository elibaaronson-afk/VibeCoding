// Small UI helpers: mobile nav toggle, dynamic year, and theme switching
(function(){
  function applyTheme(theme){
    if(theme === 'light'){
      document.documentElement.setAttribute('data-theme','light');
      themeBtn && (themeBtn.textContent = '☀️');
      themeBtn && themeBtn.setAttribute('aria-pressed','true');
    } else {
      document.documentElement.removeAttribute('data-theme');
      themeBtn && (themeBtn.textContent = '🌙');
      themeBtn && themeBtn.setAttribute('aria-pressed','false');
    }
  }

  const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)');
  let saved = localStorage.getItem('theme');
  const themeBtn = document.getElementById('themeToggle');

  // Initialize UI after DOM ready
  document.addEventListener('DOMContentLoaded', function(){
    const nav = document.getElementById('siteNav');
    const toggle = document.getElementById('navToggle');
    if(toggle && nav){
      toggle.addEventListener('click', function(){
        const open = nav.classList.toggle('open');
        const expanded = open ? 'true' : 'false';
        toggle.setAttribute('aria-expanded', expanded);
      });
    }

    // Theme initialization: saved -> system -> default dark
    let themeToSet = 'dark';
    if(saved === 'light' || saved === 'dark') themeToSet = saved;
    else if(prefersDark && !saved) themeToSet = prefersDark.matches ? 'dark' : 'light';
    applyTheme(themeToSet);

    // Theme toggle handler
    if(themeBtn){
      themeBtn.addEventListener('click', function(){
        const current = document.documentElement.getAttribute('data-theme') === 'light' ? 'light' : 'dark';
        const next = current === 'light' ? 'dark' : 'light';
        applyTheme(next);
        localStorage.setItem('theme', next);
      });
    }

    // React to system changes when user has not explicitly set preference
    if(prefersDark){
      prefersDark.addEventListener('change', function(e){
        const userSet = localStorage.getItem('theme');
        if(userSet) return; // respect user's explicit choice
        applyTheme(e.matches ? 'dark' : 'light');
      });
    }

    const yearEl = document.getElementById('year');
    if(yearEl) yearEl.textContent = new Date().getFullYear();
  });
})();
