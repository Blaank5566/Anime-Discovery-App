// Elements
const searchInput = document.getElementById("search-input");
const searchBtn = document.getElementById("search-btn");
const genreSelect = document.getElementById("genre-select");
const resultsDiv = document.getElementById("results");
const modal = document.getElementById("anime-modal");

let currentPage = 1;
let currentQuery = "";

// Search button click
searchBtn.addEventListener("click", () => {
    const query = searchInput.value.trim();
    if (!query) return;

    currentQuery = query;
    currentPage = 1;

    searchAnime(query, currentPage, true);
});

// Get genre query
function getGenreQuery() {
    const genre = genreSelect.value;
    return genre ? `&genres=${genre}` : "";
}

// Search function
async function searchAnime(query, page, reset = false) {
    if (reset) resultsDiv.innerHTML = "Loading...";

    try {
        const genreQuery = getGenreQuery();
        const res = await fetch(
            `https://api.jikan.moe/v4/anime?q=${encodeURIComponent(query)}&limit=12&page=${page}${genreQuery}`
        );
        const data = await res.json();

        if (reset) resultsDiv.innerHTML = "";

        // Render cards
        resultsDiv.innerHTML += data.data
            .map((anime) => `
                <div class="anime-card"
                    data-title="${anime.title}"
                    data-synopsis="${anime.synopsis || "No synopsis"}"
                    data-image="${anime.images.jpg.large_image_url}"
                    data-score="${anime.score || "N/A"}"
                    data-year="${anime.year || "Unknown"}"
                    data-trailer="${anime.trailer?.embed_url || ""}"
                >
                    <img src="${anime.images.jpg.image_url}" alt="${anime.title}">
                    <h2>${anime.title}</h2>
                </div>
            `)
            .join("");

        // Add click event to open modal
        document.querySelectorAll(".anime-card").forEach((card) => {
            card.onclick = () => {
                const anime = {
                    title: card.dataset.title,
                    synopsis: card.dataset.synopsis,
                    image: card.dataset.image,
                    score: card.dataset.score,
                    year: card.dataset.year,
                    trailer: card.dataset.trailer,
                };
                openModal(anime);
            };
        });

        createLoadMore(data.pagination.has_next_page);
    } catch (err) {
        resultsDiv.innerHTML = "Error loading anime.";
        console.error(err);
    }
}

// Load More button
function createLoadMore(hasNext) {
    const oldBtn = document.getElementById("loadMore");
    if (oldBtn) oldBtn.remove();

    if (!hasNext) return;

    const btn = document.createElement("button");
    btn.id = "loadMore";
    btn.className = "load-more";
    btn.textContent = "Load More";
    btn.onclick = () => {
        currentPage++;
        searchAnime(currentQuery, currentPage, false);
    };
    resultsDiv.after(btn);
}

// Open modal function (global for HTML button)
window.openModal = function (anime) {
    modal.innerHTML = `
        <div class="modal-content">
            <button class="close-btn" onclick="closeModal()">X</button>
            <h2>${anime.title}</h2>
            <img src="${anime.image}" style="width:100%;border-radius:8px;margin-bottom:10px">
            ${
                anime.trailer
                    ? `<iframe src="${anime.trailer}" allowfullscreen></iframe>`
                    : "<p>No trailer available</p>"
            }
            <p><strong>Score:</strong> ${anime.score}</p>
            <p><strong>Year:</strong> ${anime.year}</p>
            <p>${anime.synopsis}</p>
        </div>
    `;
    modal.classList.remove("hidden");
};

// Close modal function (global for HTML button)
window.closeModal = function () {
    // Hide modal
    modal.classList.add("hidden");
    // Remove iframe to stop any playing trailer
    modal.innerHTML = "";
};