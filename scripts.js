// Elements
const searchInput = document.getElementById("search-input");
const searchBtn = document.getElementById("search-btn");
const genreSelect = document.getElementById("genre-select");
const resultsDiv = document.getElementById("results");
const popularDiv = document.getElementById("popular-results");
const modal = document.getElementById("anime-modal");

let currentPage = 1;
let currentQuery = "";
let currentGenre = "";
let currentMode = "frontpage"; // frontpage, search

// -------------------- Search --------------------
searchBtn.addEventListener("click", () => {
    const query = searchInput.value.trim();
    currentQuery = query;
    currentGenre = genreSelect.value;
    currentPage = 1;

    searchAnime(query, currentPage, true);
});

async function searchAnime(query, page, reset = false) {
    currentMode = "search";
    if (reset) resultsDiv.innerHTML = "Loading...";

    try {
        let url = `https://api.jikan.moe/v4/anime?limit=12&page=${page}`;
        if (query) url += `&q=${encodeURIComponent(query)}`;
        if (currentGenre) url += `&genres=${currentGenre}`;

        const res = await fetch(url);
        const data = await res.json();

        if (reset) resultsDiv.innerHTML = "";
        renderAnimeCards(data.data, resultsDiv);
        createLoadMore(data.pagination.has_next_page, "search", "search", page);
    } catch (err) {
        resultsDiv.innerHTML = "Error loading anime.";
        console.error(err);
    }
}

// -------------------- Front Page (Ongoing) --------------------
async function loadFrontPage(page = 1) {
    currentMode = "frontpage";
    if (page === 1) resultsDiv.innerHTML = "Loading Ongoing Anime...";
    
    try {
        const res = await fetch(`https://api.jikan.moe/v4/anime?status=airing&limit=12&page=${page}`);
        const data = await res.json();

        if (page === 1) resultsDiv.innerHTML = "";
        renderAnimeCards(data.data, resultsDiv);
        createLoadMore(data.pagination.has_next_page, "frontpage", "ongoing", page);
    } catch (err) {
        resultsDiv.innerHTML = "Error loading front page.";
        console.error(err);
    }
}

// -------------------- Popular Anime --------------------
async function loadPopularAnime(page = 1) {
    if (page === 1) popularDiv.innerHTML = "Loading Popular Anime...";

    try {
        const res = await fetch(`https://api.jikan.moe/v4/anime?order_by=popularity&sort=desc&limit=12&page=${page}`);
        const data = await res.json();

        if (page === 1) popularDiv.innerHTML = "";
        renderAnimeCards(data.data, popularDiv);
        createLoadMore(data.pagination.has_next_page, "popular", "popular", page);
    } catch (err) {
        popularDiv.innerHTML = "Error loading popular anime.";
        console.error(err);
    }
}

// -------------------- Render Cards --------------------
function renderAnimeCards(animeList, container) {
    container.innerHTML += animeList
        .map(anime => `
        <div class="anime-card"
            data-title="${anime.title}"
            data-synopsis="${anime.synopsis || "No synopsis"}"
            data-image="${anime.images.jpg.large_image_url}"
            data-score="${anime.score || "N/A"}"
            data-year="${anime.year || "Unknown"}"
            data-trailer="${anime.trailer?.embed_url || ""}">
            <img src="${anime.images.jpg.image_url}" alt="${anime.title}">
            <h2>${anime.title}</h2>
        </div>
    `).join("");

    container.querySelectorAll(".anime-card").forEach(card => {
        card.onclick = () => {
            const anime = {
                title: card.dataset.title,
                synopsis: card.dataset.synopsis,
                image: card.dataset.image,
                score: card.dataset.score,
                year: card.dataset.year,
                trailer: card.dataset.trailer
            };
            openModal(anime);
        };
    });
}

// -------------------- Load More --------------------
function createLoadMore(hasNext, mode, type = "", page = 1) {
    const oldBtn = document.getElementById(`${type}-loadMore`);
    if (oldBtn) oldBtn.remove();
    if (!hasNext) return;

    const btn = document.createElement("button");
    btn.id = `${type}-loadMore`;
    btn.className = "load-more";
    btn.textContent = "Load More";
    btn.onclick = () => {
        const nextPage = page + 1;
        if (mode === "search") searchAnime(currentQuery, nextPage, false);
        else if (mode === "frontpage") loadFrontPage(nextPage);
        else if (mode === "popular") loadPopularAnime(nextPage);
    };

    if (type === "popular") popularDiv.after(btn);
    else resultsDiv.after(btn);
}

// -------------------- Modal --------------------
window.openModal = function(anime) {
    modal.innerHTML = `
        <div class="modal-content">
            <button class="close-btn" onclick="closeModal()">X</button>
            <h2>${anime.title}</h2>
            <img src="${anime.image}" style="width:100%;border-radius:8px;margin-bottom:10px">
            ${anime.trailer ? `<iframe src="${anime.trailer}" allowfullscreen></iframe>` : "<p>No trailer available</p>"}
            <p><strong>Score:</strong> ${anime.score}</p>
            <p><strong>Year:</strong> ${anime.year}</p>
            <p>${anime.synopsis}</p>
        </div>
    `;
    modal.classList.remove("hidden");
};

window.closeModal = function() {
    modal.classList.add("hidden");
    modal.innerHTML = "";
};

// -------------------- Initialize --------------------
window.addEventListener("DOMContentLoaded", () => {
    loadFrontPage();    // Ongoing anime
    loadPopularAnime(); // Popular anime
});
