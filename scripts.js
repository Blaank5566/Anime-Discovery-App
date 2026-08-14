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


// -------------------- AniList API --------------------

async function fetchFromAniList(query, variables) {

    const url = "https://graphql.anilist.co";

    const options = {
        method: "POST",

        headers: {
            "Content-Type": "application/json",
            "Accept": "application/json"
        },

        body: JSON.stringify({
            query,
            variables
        })
    };


    const res = await fetch(url, options);


    if (!res.ok) {
        throw new Error(
            "AniList Error Status: " + res.status
        );
    }


    const json = await res.json();


    if (json.errors) {
        console.error("AniList GraphQL errors:", json.errors);

        throw new Error(
            json.errors[0]?.message || "AniList GraphQL error"
        );
    }


    return json.data;
}



// -------------------- Search --------------------

searchBtn.addEventListener("click", () => {

    currentQuery = searchInput.value.trim();

    currentGenre = genreSelect.value;

    currentMode = "search";

    searchAnime(
        currentQuery,
        1,
        true
    );
});


searchInput.addEventListener("keypress", (e) => {

    if (e.key === "Enter") {
        searchBtn.click();
    }

});



async function searchAnime(
    query,
    page = 1,
    reset = false
) {

    currentMode = "search";


    if (reset) {
        resultsDiv.innerHTML = "Loading...";
    }


    const graphqlQuery = `

        query (
            $page: Int,
            $search: String,
            $genre: String
        ) {

            Page(
                page: $page,
                perPage: 12
            ) {

                pageInfo {
                    hasNextPage
                }

                media(
                    search: $search,
                    genre: $genre,
                    type: ANIME,
                    sort: POPULARITY_DESC
                ) {

                    id

                    title {
                        english
                        romaji
                    }

                    description

                    status

                    score: averageScore

                    coverImage {
                        large
                    }

                    trailer {
                        id
                        site
                    }
                }
            }
        }
    `;


    const variables = {
        page
    };


    if (query) {
        variables.search = query;
    }


    if (
        currentGenre &&
        genreMapping[currentGenre]
    ) {

        variables.genre =
            genreMapping[currentGenre];

    }


    try {

        const data =
            await fetchFromAniList(
                graphqlQuery,
                variables
            );


        if (reset) {
            resultsDiv.innerHTML = "";
        }


        removeLoadMoreButton(resultsDiv);


        renderAnimeCards(
            data.Page.media,
            resultsDiv
        );


        if (
            data.Page.pageInfo.hasNextPage
        ) {

            createLoadMore(
                true,
                "search",
                resultsDiv,
                page
            );

        }


    } catch (error) {

        resultsDiv.innerHTML =
            "Unable to load search results. Please try again.";

        console.error(error);

    }

}



// -------------------- Front Page --------------------

async function loadFrontPage(page = 1) {

    currentMode = "frontpage";


    if (page === 1) {
        resultsDiv.innerHTML =
            "Loading Ongoing Anime...";
    }


    const graphqlQuery = `

        query ($page: Int) {

            Page(
                page: $page,
                perPage: 12
            ) {

                pageInfo {
                    hasNextPage
                }

                media(
                    status: RELEASING,
                    type: ANIME,
                    sort: POPULARITY_DESC
                ) {

                    id

                    title {
                        english
                        romaji
                    }

                    description

                    status

                    score: averageScore

                    coverImage {
                        large
                    }

                    trailer {
                        id
                        site
                    }
                }
            }
        }
    `;


    try {

        const data =
            await fetchFromAniList(
                graphqlQuery,
                { page }
            );


        if (page === 1) {
            resultsDiv.innerHTML = "";
        }


        removeLoadMoreButton(
            resultsDiv
        );


        renderAnimeCards(
            data.Page.media,
            resultsDiv
        );


        if (
            data.Page.pageInfo.hasNextPage
        ) {

            createLoadMore(
                true,
                "frontpage",
                resultsDiv,
                page
            );

        }


    } catch (error) {

        resultsDiv.innerHTML =
            "Error loading ongoing anime.";

        console.error(error);

    }

}



// -------------------- Popular Anime --------------------

async function loadPopularAnime(page = 1) {

    if (page === 1) {

        popularDiv.innerHTML =
            "Loading Popular Anime...";

    }


    const graphqlQuery = `

        query ($page: Int) {

            Page(
                page: $page,
                perPage: 12
            ) {

                pageInfo {
                    hasNextPage
                }

                media(
                    type: ANIME,
                    sort: POPULARITY_DESC
                ) {

                    id

                    title {
                        english
                        romaji
                    }

                    description

                    status

                    score: averageScore

                    coverImage {
                        large
                    }

                    trailer {
                        id
                        site
                    }
                }
            }
        }
    `;


    try {

        const data =
            await fetchFromAniList(
                graphqlQuery,
                { page }
            );


        if (page === 1) {
            popularDiv.innerHTML = "";
        }


        removeLoadMoreButton(
            popularDiv
        );


        renderAnimeCards(
            data.Page.media,
            popularDiv
        );


        if (
            data.Page.pageInfo.hasNextPage
        ) {

            createLoadMore(
                true,
                "popular",
                popularDiv,
                page
            );

        }


    } catch (error) {

        popularDiv.innerHTML =
            "Error loading popular anime.";

        console.error(error);

    }

}



// -------------------- Render Anime Cards --------------------

function renderAnimeCards(
    animeList,
    container
) {

    if (
        !animeList ||
        !Array.isArray(animeList)
    ) {

        console.error(
            "Invalid anime list:",
            animeList
        );

        return;

    }


    animeList.forEach(anime => {

        const title =
            anime.title?.english ||
            anime.title?.romaji ||
            "Unknown Title";


        const imageUrl =
            anime.coverImage?.large ||
            "";


        const card =
            document.createElement("div");


        card.classList.add(
            "anime-card"
        );


        card.innerHTML = `

            <img
                src="${imageUrl}"
                alt="${escapeHTML(title)}"
                loading="lazy"
            >

            <h2>${escapeHTML(title)}</h2>

        `;


        container.appendChild(card);


        card.addEventListener(
            "click",
            () => {

                showAnimeModal(anime);

            }
        );

    });

}



// -------------------- Load More --------------------

function createLoadMore(
    hasNextPage,
    mode,
    container,
    page
) {

    if (!hasNextPage) {
        return;
    }


    const btn =
        document.createElement("button");


    btn.classList.add(
        "load-more"
    );


    btn.innerText =
        "Load More";


    btn.addEventListener(
        "click",
        async () => {

            btn.disabled = true;

            btn.innerText =
                "Loading...";


            const nextPage =
                page + 1;


            try {

                if (mode === "search") {

                    await searchAnime(
                        currentQuery,
                        nextPage,
                        false
                    );

                }

                else if (
                    mode === "frontpage"
                ) {

                    await loadFrontPage(
                        nextPage
                    );

                }

                else if (
                    mode === "popular"
                ) {

                    await loadPopularAnime(
                        nextPage
                    );

                }


            } catch (error) {

                console.error(error);

                btn.disabled = false;

                btn.innerText =
                    "Load More";

            }

        }
    );


    container.after(btn);

}



function removeLoadMoreButton(
    container
) {

    const nextEl =
        container.nextElementSibling;


    if (
        nextEl &&
        nextEl.classList.contains(
            "load-more"
        )
    ) {

        nextEl.remove();

    }

}



// -------------------- Modal --------------------

function showAnimeModal(anime) {

    const title =
        anime.title?.english ||
        anime.title?.romaji ||
        "Unknown Title";


    const synopsis =
        anime.description
            ? anime.description.replace(
                /<\/?[^>]+(>|$)/g,
                ""
            )
            : "No synopsis available.";


    const score =
        anime.score
            ? "⭐ " + (anime.score / 10).toFixed(1)
            : "N/A";


    const status =
        anime.status ||
        "N/A";


    // Create modal content
    modal.innerHTML = `

        <div class="modal-content">

            <button
                class="close-btn"
                id="close-modal"
            >
                &times;
            </button>


            <div
                id="modal-media-holder"
            ></div>


            <h2>
                ${escapeHTML(title)}
            </h2>


            <p>
                <strong>Score:</strong>
                ${score}
                |
                <strong>Status:</strong>
                ${escapeHTML(status)}
            </p>


            <p>
                ${escapeHTML(synopsis)}
            </p>

        </div>

    `;


    const mediaHolder =
        modal.querySelector(
            "#modal-media-holder"
        );


    // --------------------
    // TRAILER
    // --------------------

    if (
        anime.trailer &&
        anime.trailer.id &&
        anime.trailer.site?.toLowerCase() ===
            "youtube"
    ) {

        const trailerId =
            String(anime.trailer.id).trim();


        const iframe =
            document.createElement("iframe");


        iframe.src =
            `https://www.youtube.com/embed/${encodeURIComponent(trailerId)}`;


        iframe.title =
            `${title} Trailer`;


        iframe.width = "100%";

        iframe.height = "350";


        iframe.frameBorder = "0";


        iframe.allow =
            "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share";


        iframe.allowFullscreen = true;


        mediaHolder.appendChild(
            iframe
        );


    } else {

        // --------------------
        // NO TRAILER
        // --------------------

        const image =
            document.createElement("img");


        image.src =
            anime.coverImage?.large || "";


        image.alt =
            title;


        mediaHolder.appendChild(
            image
        );

    }


    modal.classList.remove(
        "hidden"
    );


    // Close button
    document
        .getElementById("close-modal")
        .addEventListener(
            "click",
            closeModal
        );


    // Close when clicking outside
    modal.addEventListener(
        "click",
        handleModalBackgroundClick
    );

}



// -------------------- Modal Closing --------------------

function handleModalBackgroundClick(e) {

    if (e.target === modal) {
        closeModal();
    }

}


function closeModal() {

    modal.classList.add(
        "hidden"
    );


    modal.innerHTML = "";

}



// -------------------- HTML Safety --------------------

function escapeHTML(value) {

    return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");

}



// -------------------- Init --------------------

function init() {

    loadFrontPage(1);


    // Small delay so both requests
    // don't happen at exactly the same time.

    setTimeout(() => {

        loadPopularAnime(1);

    }, 1000);

}


init();
