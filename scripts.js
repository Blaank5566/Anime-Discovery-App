// Elements
const searchInput = document.getElementById("search-input");
const searchBtn = document.getElementById("search-btn");
const genreSelect = document.getElementById("genre-select");
const resultsDiv = document.getElementById("results");
const popularDiv = document.getElementById("popular-results");
const modal = document.getElementById("anime-modal");

let currentQuery = "";
let currentGenre = "";
let currentMode = "frontpage";

// HTML Value to AniList Genre String Mapping
const genreMapping = {
    "1": "Action",
    "2": "Adventure",
    "4": "Comedy",
    "8": "Drama",
    "10": "Fantasy",
    "23": "Isekai",
    "9": "Ecchi",
    "27": "Shounen",
    "22": "Romance",
    "40": "Supernatural",
    "37": "Horror"
};

// -------------------- GraphQL Core Fetcher --------------------

async function fetchFromAniList(query, variables) {
    const url = 'https://graphql.anilist.co';
    const options = {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
        },
        body: JSON.stringify({ query, variables })
    };

    const res = await fetch(url, options);
    if (!res.ok) {
        throw new Error(`AniList Error: ${res.status}`);
    }
    const json = await res.json();
    return json.data;
}

// -------------------- Search --------------------

searchBtn.addEventListener("click", () => {
    currentQuery = searchInput.value.trim();
    currentGenre = genreSelect.value;
    searchAnime(currentQuery, 1, true);
});

searchInput.addEventListener("keypress", (e) => {
    if (e.key === "Enter") searchBtn.click();
});

async function searchAnime(query, page = 1, reset = false) {
    currentMode = "search";
    if (reset) resultsDiv.innerHTML = "Loading...";

    // AniList GraphQL Query
    const graphqlQuery = `
        query ($page: Int, $search: String, $genre: String) {
            Page(page: $page, perPage: 12) {
                pageInfo { hasNextPage }
                media(search: $search, genre: $genre, type: ANIME, sort: POPULARITY_DESC) {
                    id title { english romaji }
                    description status score: averageScore
                    coverImage { large }
                    trailer { id site }
                }
            }
        }`;

    const variables = { page };
    if (query) variables.search = query;
    if (currentGenre && genreMapping[currentGenre]) {
        variables.genre = genreMapping[currentGenre];
    }

    try {
        const data = await fetchFromAniList(graphqlQuery, variables);
        if (reset) resultsDiv.innerHTML = "";

        removeLoadMoreButton(resultsDiv);
        renderAnimeCards(data.Page.media, resultsDiv);

        if (data.Page.pageInfo.hasNextPage) {
            createLoadMore(true, "search", resultsDiv, page);
        }
    } catch (error) {
        resultsDiv.innerHTML = "Unable to load search results. Please try again.";
        console.error(error);
    }
}

// -------------------- Front Page (Ongoing Anime) --------------------

async function loadFrontPage(page = 1) {
    currentMode = "frontpage";
    if (page === 1) resultsDiv.innerHTML = "Loading Ongoing Anime...";

    const graphqlQuery = `
        query ($page: Int) {
            Page(page: $page, perPage: 12) {
                pageInfo { hasNextPage }
                media(status: RELEASING, type: ANIME, sort: POPULARITY_DESC) {
                    id title { english romaji }
                    description status score: averageScore
                    coverImage { large }
                    trailer { id site }
                }
            }
        }`;

    try {
        const data = await fetchFromAniList(graphqlQuery, { page });
        if (page === 1) resultsDiv.innerHTML = "";

        removeLoadMoreButton(resultsDiv);
        renderAnimeCards(data.Page.media, resultsDiv);

        if (data.Page.pageInfo.hasNextPage) {
            createLoadMore(true, "frontpage", resultsDiv, page);
        }
    } catch (err) {
        resultsDiv.innerHTML = "Error loading ongoing anime.";
        console.error(err);
    }
}

// -------------------- Popular Anime --------------------

async function loadPopularAnime(page = 1) {
    if (page === 1) popularDiv.innerHTML = "Loading Popular Anime...";

    const graphqlQuery = `
        query ($page: Int) {
            Page(page: $page, perPage: 12) {
                pageInfo { hasNextPage }
                media(type: ANIME, sort: POPULARITY_DESC) {
                    id title { english romaji }
                    description status score: averageScore
                    coverImage { large }
                    trailer { id site }
                }
            }
        }`;

    try {
        const data = await fetchFromAniList(graphqlQuery, { page });
        if (page === 1) popularDiv.innerHTML = "";

        removeLoadMoreButton(popularDiv);
        renderAnimeCards(data.Page.media, popularDiv);

        if (data.Page.pageInfo.hasNextPage) {
            createLoadMore(true, "popular", popularDiv, page);
        }
    } catch (err) {
        popularDiv.innerHTML = "Error loading popular anime.";
        console.error(err);
    }
}

// -------------------- Render Cards --------------------

function renderAnimeCards(animeList, container) {
    if (!animeList || !Array.isArray(animeList)) return;

    animeList.forEach(anime => {
        const title = anime.title.english || anime.title.romaji || "Unknown Title";
        const imageUrl = anime.coverImage?.large || "https://placeholder.com";

        const card = document.createElement("div");
        card.classList.add("anime-card");
        card.innerHTML = `
            <img src="${imageUrl}" alt="${title}" loading="lazy">
            <h2>${title}</h2>
        `;

        card.addEventListener("click", () => showAnimeModal(anime));
        container.appendChild(card);
    });
}

// -------------------- Load More Buttons --------------------

function createLoadMore(hasNextPage, mode, container, page) {
    if (!hasNextPage) return;

    const btn = document.createElement("button");
    btn.classList.add("load-more");
    btn.innerText = "Load More";

    btn.addEventListener("click", () => {
        btn.disabled = true;
        btn.innerText = "Loading...";
        const nextPage = page + 1;

        if (mode === "search") {
            searchAnime(currentQuery, nextPage, false);
        } else if (mode === "frontpage") {
            loadFrontPage(nextPage);
        } else if (mode === "popular") {
            loadPopularAnime(nextPage);
        }
    });

    container.after(btn);
}

function removeLoadMoreButton(container) {
    const nextEl = container.nextElementSibling;
    if (nextEl && nextEl.classList.contains("load-more")) {
        nextEl.remove();
    }
}

// -------------------- Modal Window --------------------

function showAnimeModal(anime) {
    const title = anime.title.english || anime.title.romaji || "Unknown Title";
    // Strip HTML tags from description if present
    const synopsis = anime.description ? anime.description.replace(/<\/?[^>]+(>|$)/g, "") : "No synopsis available.";
    const score = anime.score ? `⭐ ${anime.score / 10}` : "N/A";
    const status = anime.status || "N/A";

    let trailerHTML = "";
    if (anime.trailer && anime.trailer.site === "youtube") {
        trailerHTML = `<iframe src="https://youtube.com{anime.trailer.id}" allowfullscreen></iframe>`;
    } else {
        trailerHTML = `<img src="${anime.coverImage?.large}" alt="${title}">`;
    }

    modal.innerHTML = `
        <div class="modal-content">
            <button class="close-btn" id="close-modal">&times;</button>
            ${trailerHTML}
            <h2>${title}</h2>
            <p><strong>Score:</strong> ${score} | <strong>Status:</strong> ${status}</p>
            <p>${synopsis}</p>
        </div>
    `;

    modal.classList.remove("hidden");

    document.getElementById("close-modal").addEventListener("click", closeModal);
    modal.addEventListener("click", (e) => {
        if (e.target === modal) closeModal();
    });
}

function closeModal() {
    modal.innerHTML = "";
    modal.classList.add("hidden");
}

// -------------------- Init --------------------

function init() {
    loadFrontPage(1);
    loadPopularAnime(1);
}

init();
