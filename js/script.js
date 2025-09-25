document.addEventListener("DOMContentLoaded", () => {
    const content = document.getElementById("content");
    const themeToggle = document.getElementById("theme-toggle");
    const searchInput = document.getElementById("search-input");
    const filterSelect = document.getElementById("filter-select");
    const bookSelect = document.getElementById("book-select");
    const chapterSelect = document.getElementById("chapter-select");
    const verseSelect = document.getElementById("verse-select");
    const bookName = document.getElementById("book-name");

    let allBooksData = []; // Store all books data
    let currentFilteredData = []; // Store currently filtered data
    let selectedBook = '';
    let selectedChapter = '';
    let selectedVerse = '';

    // List of available book files
    const bookFiles = [
        'titus.json',
        'philippians.json'
        // Add more book files here as needed
    ];

    // Load all JSON files
    async function loadAllBooks() {
        content.innerHTML = '<div class="loading">Loading books...</div>';
        
        try {
            const bookPromises = bookFiles.map(file => 
                fetch(`json/books/${file}`)
                    .then(response => {
                        if (!response.ok) {
                            throw new Error(`Failed to load ${file}`);
                        }
                        return response.json();
                    })
            );
            
            const books = await Promise.all(bookPromises);
            
            // Transform data to include book name with each chapter
            allBooksData = books.flatMap(book => 
                book.chapters.map(chapter => ({
                    bookName: book.book,
                    chapter: chapter.chapter,
                    verses: chapter.verses
                }))
            );
            
            // Update book name display
            bookName.textContent = "All Books";
            
            // Populate book dropdown with unique book names
            populateBooks(books.map(book => book.book));
            
            // Display all verses initially
            currentFilteredData = [...allBooksData];
            displayVerses(currentFilteredData);
            
        } catch (error) {
            console.error('Error loading books:', error);
            content.innerHTML = '<p>Error loading Bible books. Please try again later.</p>';
        }
    }

    // Display verses function
    function displayVerses(chapters) {
        content.innerHTML = '';
        
        if (chapters.length === 0) {
            content.innerHTML = '<p>No verses found.</p>';
            return;
        }
        
        // Group by book for better organization
        const bookGroups = {};
        chapters.forEach(chapter => {
            if (!bookGroups[chapter.bookName]) {
                bookGroups[chapter.bookName] = [];
            }
            bookGroups[chapter.bookName].push(chapter);
        });
        
        // Display verses grouped by book
        Object.entries(bookGroups).forEach(([book, bookChapters]) => {
            bookChapters.forEach(chapter => {
                chapter.verses.forEach(verse => {
                    const verseElement = document.createElement('div');
                    verseElement.className = 'verse-item';
                    verseElement.innerHTML = `
                        <h3>${book} ${chapter.chapter}:${verse.verse}</h3>
                        <p><strong>${verse.translation}</strong></p>
                    `;
                    
                    if (verse.notes && verse.notes.length > 0) {
                        const notesContainer = document.createElement('div');
                        notesContainer.className = 'notes-container';
                        verse.notes.forEach(note => {
                            notesContainer.innerHTML += `<p class="note"><em>${note.category}: ${note.note}</em></p>`;
                        });
                        verseElement.appendChild(notesContainer);
                    }
                    
                    content.appendChild(verseElement);
                });
            });
        });
    }

    // Apply all filters
    function applyFilters() {
        let filteredData = [...allBooksData];
        
        // Filter by book if selected
        if (selectedBook) {
            filteredData = filteredData.filter(ch => ch.bookName === selectedBook);
            bookName.textContent = selectedBook;
        } else {
            bookName.textContent = "All Books";
        }
        
        // Filter by chapter if selected
        if (selectedChapter) {
            filteredData = filteredData.filter(ch => ch.chapter == selectedChapter);
        }
        
        // Filter by verse if selected
        if (selectedVerse && selectedChapter) {
            filteredData = filteredData.map(chapter => ({
                ...chapter,
                verses: chapter.verses.filter(v => v.verse == selectedVerse)
            })).filter(chapter => chapter.verses.length > 0);
        }
        
        // Apply search filter
        const searchTerm = searchInput.value.toLowerCase();
        if (searchTerm) {
            filteredData = filteredData.map(chapter => ({
                ...chapter,
                verses: chapter.verses.filter(verse => {
                    return verse.translation.toLowerCase().includes(searchTerm) ||
                           (verse.notes && verse.notes.some(note => note.note.toLowerCase().includes(searchTerm)));
                })
            })).filter(chapter => chapter.verses.length > 0);
        }
        
        // Apply category filter
        const selectedCategory = filterSelect.value;
        if (selectedCategory) {
            filteredData = filteredData.map(chapter => ({
                ...chapter,
                verses: chapter.verses.filter(verse => {
                    return verse.notes && verse.notes.some(note => note.category === selectedCategory);
                })
            })).filter(chapter => chapter.verses.length > 0);
        }
        
        currentFilteredData = filteredData;
        displayVerses(filteredData);
    }

    // Populate book dropdown
    function populateBooks(bookNames) {
        bookSelect.innerHTML = '<option value="">All Books</option>';
        bookNames.forEach(book => {
            bookSelect.innerHTML += `<option value="${book}">${book}</option>`;
        });
    }

    // Book selection handler
    bookSelect.addEventListener("change", (event) => {
        selectedBook = event.target.value;
        selectedChapter = '';
        selectedVerse = '';
        
        if (!selectedBook) {
            // Reset to show all books
            chapterSelect.innerHTML = '<option value="">All Chapters</option>';
            chapterSelect.disabled = true;
            verseSelect.innerHTML = '<option value="">All Verses</option>';
            verseSelect.disabled = true;
        } else {
            populateChapters();
        }
        applyFilters();
    });

    // Populate chapter dropdown based on selected book
    function populateChapters() {
        chapterSelect.innerHTML = '<option value="">All Chapters</option>';
        
        // Get unique chapters for selected book
        const bookChapters = allBooksData
            .filter(ch => ch.bookName === selectedBook)
            .map(ch => ch.chapter);
        const uniqueChapters = [...new Set(bookChapters)];
        
        uniqueChapters.forEach(chapter => {
            chapterSelect.innerHTML += `<option value="${chapter}">Chapter ${chapter}</option>`;
        });
        chapterSelect.disabled = false;
        
        // Reset verse selection
        verseSelect.innerHTML = '<option value="">All Verses</option>';
        verseSelect.disabled = true;
    }

    // Chapter selection handler
    chapterSelect.addEventListener("change", (event) => {
        selectedChapter = event.target.value;
        selectedVerse = '';
        
        if (!selectedChapter) {
            verseSelect.innerHTML = '<option value="">All Verses</option>';
            verseSelect.disabled = true;
        } else {
            populateVerses();
        }
        applyFilters();
    });

    // Populate verse dropdown based on selected chapter
    function populateVerses() {
        verseSelect.innerHTML = '<option value="">All Verses</option>';
        
        const chapter = allBooksData.find(ch => 
            ch.bookName === selectedBook && ch.chapter == selectedChapter
        );
        
        if (chapter) {
            chapter.verses.forEach(verse => {
                verseSelect.innerHTML += `<option value="${verse.verse}">Verse ${verse.verse}</option>`;
            });
            verseSelect.disabled = false;
        }
    }

    // Verse selection handler
    verseSelect.addEventListener("change", (event) => {
        selectedVerse = event.target.value;
        applyFilters();
    });

    // Search functionality
    searchInput.addEventListener("input", () => {
        applyFilters();
    });

    // Filter functionality
    filterSelect.addEventListener("change", () => {
        applyFilters();
    });

    // Theme toggle functionality
    themeToggle.addEventListener("click", () => {
        document.body.classList.toggle("dark-mode");
        document.body.classList.toggle("light-mode");
    });

    // Initialize by loading all books
    loadAllBooks();
});