document.addEventListener("DOMContentLoaded", function () {
  var navToggle = document.querySelector(".nav-toggle-button");
  var navLinks = document.getElementById("main-nav-links");
  var footerYear = document.getElementById("footer-year");

  if (footerYear) {
    footerYear.textContent = new Date().getFullYear().toString();
  }

  if (navToggle && navLinks) {
    navToggle.addEventListener("click", function () {
      var expanded = navToggle.getAttribute("aria-expanded") === "true";
      navToggle.setAttribute("aria-expanded", expanded ? "false" : "true");
      navLinks.classList.toggle("is-open");
    });
  }
});

