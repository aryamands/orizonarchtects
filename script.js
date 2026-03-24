document.addEventListener("DOMContentLoaded", () => {

  const BASE_URL = "https://orizon-backend.onrender.com";

  // ================= CONTACT =================
  const contactForm = document.querySelector(".contact-form");

  if (contactForm) {
    contactForm.addEventListener("submit", async (e) => {
      e.preventDefault();

      const name = document.getElementById("name").value.trim();
      const email = document.getElementById("email").value.trim();
      const message = document.getElementById("message").value.trim();

      try {
        const res = await fetch(`${BASE_URL}/contact`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name, email, message })
        });

        const data = await res.json();
        alert(data.message || data.error);

        if (res.ok) contactForm.reset();

      } catch (err) {
        console.error(err);
        alert("Contact failed ❌");
      }
    });
  }

  // ================= NEWSLETTER =================
  const newsletterForm = document.querySelector(".newsletter-form");

  if (newsletterForm) {
    newsletterForm.addEventListener("submit", async (e) => {
      e.preventDefault();

      const email = newsletterForm.querySelector("input").value.trim();

      try {
        const res = await fetch(`${BASE_URL}/subscribe`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email })
        });

        const data = await res.json();
        alert(data.message || data.error);

        if (res.ok) newsletterForm.reset();

      } catch (err) {
        console.error(err);
        alert("Newsletter failed ❌");
      }
    });
  }

  // ================= LOAD ARTICLES =================
  async function loadArticles() {
    const container = document.getElementById("articles-container");
    if (!container) return;

    try {
      const res = await fetch(`${BASE_URL}/articles`);
      const articles = await res.json();

      container.innerHTML = articles.map(article => `
        <div class="article-card">
          <h3>${article.title}</h3>
          ${article.image ? `<img src="${article.image}">` : ""}
          <p>${article.content}</p>
        </div>
      `).join("");

    } catch (err) {
      console.error(err);
    }
  }

  loadArticles();

});