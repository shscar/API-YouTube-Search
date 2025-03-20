const API_KEY = "<code-key-api>"; // lengkapi dengan key-api
const BASE_URL = "https://www.googleapis.com/youtube/v3";

const searchInput = $("#searchInput");
const searchButton = $("#searchButton");
const resultsContainer = $("#resultsContainer");
const filterDuration = $("#filterDuration");
const filterOrder = $("#filterOrder");
const loadingIndicator = $("#loading");

// Fungsi untuk AJAX request
function fetchAPI(endpoint, params, onSuccess) {
    loadingIndicator.show();
    $.ajax({
        url: `${BASE_URL}/${endpoint}`,
        type: "GET",
        data: { ...params, key: API_KEY },
        success: function (response) {
            loadingIndicator.hide(); // Perubahan: Sembunyikan loading setelah sukses
            onSuccess(response);
        },
        error: function () {
            loadingIndicator.hide();
            Swal.fire("Error", "Gagal mengambil data", "error"); // Perubahan: Tambah SweetAlert untuk error
        },
    });
}

// Fungsi Pencarian Video
function searchVideos(query) {
    const duration = filterDuration.val();
    const order = filterOrder.val();

    fetchAPI(
        "search",
        {
            part: "snippet",
            q: query,
            type: "video",
            maxResults: 10,
            videoDuration: duration !== "any" ? duration : undefined,
            order: order !== "relevance" ? order : undefined,
        },
        (response) => {
            displayVideos(response.items);
            Swal.fire("Berhasil", "Video ditemukan!", "success"); // Perubahan: Tambah SweetAlert sukses
        }
    );
}

// Fungsi Menampilkan Video
function displayVideos(videos) {
    resultsContainer.empty();
    videos.forEach((video) => {
        const { videoId } = video.id;
        const { title, description, thumbnails, channelId, channelTitle } =
            video.snippet;

        const videoHTML = `
            <div class="video-item" data-video-id="${videoId}">
                <img src="${thumbnails.medium.url}" alt="${title}" class="video-thumbnail">
                <h3>${title}</h3>
                <p>${description}</p>
                <p>Channel: <a href="https://www.youtube.com/channel/${channelId}" target="_blank">${channelTitle}</a></p>
                <button class="view-detail" data-video-id="${videoId}">Lihat Detail</button>
            </div>
        `;
        resultsContainer.append(videoHTML);
    });
}

// Fungsi Mendapatkan Detail Video
function getVideoDetails(videoId) {
    fetchAPI("videos", { part: "snippet,statistics", id: videoId }, (response) =>
        displayVideoDetails(response.items[0])
    );
}

// Fungsi Menampilkan Detail Video
function displayVideoDetails(video) {
    const { title, description, channelTitle, channelId } = video.snippet;
    const { viewCount, likeCount } = video.statistics;
    const videoId = video.id;

    const videoHTML = `
        <div class="video-detail">
            <div class="video-container">
                <iframe
                    width="100%"
                    height="315"
                    src="https://www.youtube.com/embed/${videoId}"
                    frameborder="0"
                    allowfullscreen>
                </iframe>
            </div>
        <h2>${title}</h2>
        <p>${description}</p>
        <p>Channel: <a href="https://www.youtube.com/channel/${channelId}" target="_blank">${channelTitle}</a></p>
        <p>Views: ${viewCount}</p>
        <p>Likes: ${likeCount}</p>
        <h3>Komentar:</h3>
        <div class="comments-container" id="commentsContainer"></div>
        </div>
    `;
    resultsContainer.html(videoHTML);
    getVideoComments(video.id);
}

// Fungsi Mendapatkan Komentar Video
function getVideoComments(videoId) {
    fetchAPI(
        "commentThreads",
        { part: "snippet", videoId: videoId, maxResults: 5 },
        (response) => displayComments(response.items)
    );
}

// Fungsi Menampilkan Komentar
function displayComments(comments) {
    const commentsContainer = $("#commentsContainer");
    commentsContainer.empty();

    comments.forEach((comment) => {
        const { authorDisplayName, textDisplay } =
            comment.snippet.topLevelComment.snippet;

        const commentHTML = `
            <div class="comment-item">
                <p class="author">${authorDisplayName}:</p>
                <p>${textDisplay}</p>
            </div>
        `;
        commentsContainer.append(commentHTML);
    });
}

// Event Pencarian
searchButton.on("click", function () {
    const query = $("#searchInput").val().trim();
    if (query) {
        searchVideos(query);
    } else {
        Swal.fire(
            "Peringatan",
            "Kata kunci pencarian tidak boleh kosong!",
            "warning"
        ); // Perubahan: Tambah SweetAlert untuk validasi
    }
});

// Event Klik Detail dan Redirect ke YouTube
resultsContainer.on("click", ".video-item, .view-detail", function (e) {
    const videoId = $(this).data("video-id");

    // Redirect ke YouTube jika thumbnail atau card diklik
    if ($(e.target).hasClass("video-thumbnail")) {
        window.open(`https://www.youtube.com/watch?v=${videoId}`, "_blank");
    } else {
        getVideoDetails(videoId);
    }
});
