// Pokémon API functionality
document.addEventListener('DOMContentLoaded', () => {
    // PokéAPI Base URL (No API key required)
    const POKEAPI_BASE_URL = 'https://pokeapi.co/api/v2';
    
    // DOM Elements
    const pokemonContainer = document.getElementById('pokemon-container');
    const pokemonLoader = document.getElementById('pokemon-loader');
    const sortBy = document.getElementById('sort-by');
    
    // Cache for Pokémon data
    const pokemonCache = new Map();
    let allPokemon = [];
    
    // Hide loader initially (will show when fetching)
    pokemonLoader.style.display = 'none';
    
    // Function to fetch initial list of Pokémon (first 151 - original)
    async function fetchPokemonList() {
        showLoader();
        
        try {
            const response = await fetch(`${POKEAPI_BASE_URL}/pokemon?limit=151`);
            if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
            
            const data = await response.json();
            
            // Extract the URLs for each Pokémon and fetch their details
            const pokemonPromises = data.results.map(pokemon => {
                const id = getPokemonIdFromUrl(pokemon.url);
                return fetchPokemonDetails(id);
            });
            
            allPokemon = await Promise.all(pokemonPromises);
            displayPokemon(allPokemon);
        } catch (error) {
            console.error('Error fetching Pokémon list:', error);
            pokemonContainer.innerHTML = '<p class="error-message">Failed to load Pokémon. Please try again later.</p>';
        } finally {
            hideLoader();
        }
    }
    
    // Function to extract Pokémon ID from URL
    function getPokemonIdFromUrl(url) {
        // URL format: https://pokeapi.co/api/v2/pokemon/1/
        const parts = url.split('/');
        return parts[parts.length - 2];
    }
    
    // Function to fetch details for a specific Pokémon
    async function fetchPokemonDetails(idOrName) {
        // Check cache first
        if (pokemonCache.has(idOrName)) {
            return pokemonCache.get(idOrName);
        }
        
        try {
            const response = await fetch(`${POKEAPI_BASE_URL}/pokemon/${idOrName}`);
            if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
            
            const data = await response.json();
            
            // Process and format the data
            const pokemon = {
                id: data.id,
                name: data.name.charAt(0).toUpperCase() + data.name.slice(1),
                types: data.types.map(type => ({
                    name: type.type.name,
                    url: type.type.url
                })),
                stats: data.stats.map(stat => ({
                    name: stat.stat.name,
                    value: stat.base_stat
                })),
                height: data.height / 10, // Convert to meters
                weight: data.weight / 10, // Convert to kilograms
                abilities: data.abilities.map(ability => ability.ability.name),
                sprites: {
                    front: data.sprites.front_default,
                    back: data.sprites.back_default,
                    frontShiny: data.sprites.front_shiny,
                    official: data.sprites.other['official-artwork'].front_default
                },
                species: data.species.url
            };
            
            // Cache the processed data
            pokemonCache.set(idOrName, pokemon);
            
            return pokemon;
        } catch (error) {
            console.error(`Error fetching Pokémon ${idOrName}:`, error);
            return null;
        }
    }
    
    // Function to fetch evolution chain
    async function fetchEvolutionChain(speciesUrl) {
        try {
            // First fetch the species data to get the evolution chain URL
            const speciesResponse = await fetch(speciesUrl);
            if (!speciesResponse.ok) throw new Error(`HTTP error! Status: ${speciesResponse.status}`);
            
            const speciesData = await speciesResponse.json();
            const evolutionChainUrl = speciesData.evolution_chain.url;
            
            // Then fetch the evolution chain data
            const evolutionResponse = await fetch(evolutionChainUrl);
            if (!evolutionResponse.ok) throw new Error(`HTTP error! Status: ${evolutionResponse.status}`);
            
            const evolutionData = await evolutionResponse.json();
            
            // Process the evolution chain
            return processEvolutionChain(evolutionData.chain);
        } catch (error) {
            console.error('Error fetching evolution chain:', error);
            return [];
        }
    }
    
    // Helper function to process evolution chain recursively
    function processEvolutionChain(chain) {
        const evolutions = [];
        
        // Add the base form
        evolutions.push({
            name: chain.species.name,
            url: chain.species.url,
            id: getPokemonIdFromUrl(chain.species.url)
        });
        
        // Process all evolutions recursively
        if (chain.evolves_to && chain.evolves_to.length > 0) {
            chain.evolves_to.forEach(evolution => {
                evolutions.push(...processEvolutionChain(evolution));
            });
        }
        
        return evolutions;
    }
    
    // Function to display Pokémon in the container
    function displayPokemon(pokemonList) {
        pokemonContainer.innerHTML = '';
        
        if (pokemonList.length === 0) {
            pokemonContainer.innerHTML = '<p class="no-results">No Pokémon found matching your criteria.</p>';
            return;
        }
        
        pokemonList.forEach(pokemon => {
            if (!pokemon) return; // Skip null entries
            
            const card = document.createElement('div');
            card.className = 'card pokemon-card';
            card.dataset.id = pokemon.id;
            
            // Create type badges HTML
            const typeBadges = pokemon.types.map(type => 
                `<span class="badge type-${type.name}">${type.name.charAt(0).toUpperCase() + type.name.slice(1)}</span>`
            ).join('');
            
            // Use official artwork if available, otherwise fallback to sprites
            const imageUrl = pokemon.sprites.official || pokemon.sprites.front || 'https://via.placeholder.com/200?text=No+Image';
            
            card.innerHTML = `
                <img src="${imageUrl}" alt="${pokemon.name}" class="card-image">
                <div class="card-content">
                    <h3>${pokemon.name}</h3>
                    <p>#${String(pokemon.id).padStart(3, '0')}</p>
                    <div class="pokemon-types">
                        ${typeBadges}
                    </div>
                </div>
            `;
            
            // Add click event to show detailed info
            card.addEventListener('click', () => showPokemonDetails(pokemon.id));
            
            pokemonContainer.appendChild(card);
        });
    }
    
    // Function to show detailed Pokémon information in modal
    async function showPokemonDetails(id) {
        showLoader();
        
        try {
            const pokemon = await fetchPokemonDetails(id);
            if (!pokemon) {
                throw new Error('Failed to fetch Pokémon details');
            }
            
            // Fetch evolution chain
            const evolutions = await fetchEvolutionChain(pokemon.species);
            
            // Format stats
            const statsHTML = pokemon.stats.map(stat => {
                const statName = stat.name.replace('-', ' ').split(' ').map(
                    word => word.charAt(0).toUpperCase() + word.slice(1)
                ).join(' ');
                
                return `
                    <div class="stat-item">
                        <div class="stat-label">
                            <span>${statName}</span>
                            <span>${stat.value}</span>
                        </div>
                        <div class="stat-bar">
                            <div class="stat-value" style="width: ${Math.min(stat.value, 100)}%"></div>
                        </div>
                    </div>
                `;
            }).join('');
            
            // Format evolution chain
            let evolutionHTML = '<div class="evolution-chain">';
            
            for (let i = 0; i < evolutions.length; i++) {
                const evo = evolutions[i];
                
                // Add the evolution Pokémon
                evolutionHTML += `
                    <div class="evolution-item">
                        <img src="https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${evo.id}.png" 
                             alt="${evo.name}" class="evolution-image">
                        <p>${evo.name.charAt(0).toUpperCase() + evo.name.slice(1)}</p>
                    </div>
                `;
                
                // Add arrow between evolutions (except after the last one)
                if (i < evolutions.length - 1) {
                    evolutionHTML += `
                        <div class="evolution-arrow">
                            <i class="fas fa-arrow-right"></i>
                        </div>
                    `;
                }
            }
            
            evolutionHTML += '</div>';
            
            // Format abilities
            const abilitiesHTML = pokemon.abilities.map(ability => 
                ability.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')
            ).join(', ');
            
            // Create type badges HTML
            const typeBadges = pokemon.types.map(type => 
                `<span class="badge type-${type.name}">${type.name.charAt(0).toUpperCase() + type.name.slice(1)}</span>`
            ).join('');
            
            // Create modal content
            const modalContent = `
                <div class="pokemon-detail">
                    <div class="pokemon-detail-header">
                        <img src="${pokemon.sprites.official || pokemon.sprites.front}" alt="${pokemon.name}" class="pokemon-detail-image">
                        <div class="pokemon-detail-info">
                            <h2>${pokemon.name}</h2>
                            <p>#${String(pokemon.id).padStart(3, '0')}</p>
                            <div class="pokemon-types">
                                ${typeBadges}
                            </div>
                            <p><strong>Height:</strong> ${pokemon.height} m</p>
                            <p><strong>Weight:</strong> ${pokemon.weight} kg</p>
                            <p><strong>Abilities:</strong> ${abilitiesHTML}</p>
                        </div>
                    </div>
                    
                    <div class="pokemon-detail-section">
                        <h3>Base Stats</h3>
                        <div class="pokemon-stats">
                            ${statsHTML}
                        </div>
                    </div>
                    
                    <div class="pokemon-detail-section">
                        <h3>Evolution Chain</h3>
                        ${evolutionHTML}
                    </div>
                </div>
            `;
            
            window.appUtils.openModal(modalContent);
        } catch (error) {
            console.error('Error showing Pokémon details:', error);
            window.appUtils.openModal('<p class="error-message">Failed to load Pokémon details. Please try again later.</p>');
        } finally {
            hideLoader();
        }
    }
    
    // Function to filter Pokémon by type
    function filterByType(type) {
        if (!type) {
            // If no type selected, show all Pokémon
            displayPokemon(allPokemon);
            return;
        }
        
        const filtered = allPokemon.filter(pokemon => 
            pokemon && pokemon.types.some(t => t.name === type)
        );
        
        displayPokemon(filtered);
    }
    
    // Function to sort Pokémon
    function sortPokemon(sortValue) {
        if (!sortValue) {
            // If no sort option selected, revert to default (by ID)
            displayPokemon([...allPokemon]);
            return;
        }
        
        let sorted;
        
        switch (sortValue) {
            case 'id':
                sorted = [...allPokemon].sort((a, b) => a.id - b.id);
                break;
            case 'name':
                sorted = [...allPokemon].sort((a, b) => a.name.localeCompare(b.name));
                break;
            case 'attack':
                sorted = [...allPokemon].sort((a, b) => {
                    const aAttack = a.stats.find(stat => stat.name === 'attack')?.value || 0;
                    const bAttack = b.stats.find(stat => stat.name === 'attack')?.value || 0;
                    return bAttack - aAttack; // Descending
                });
                break;
            case 'defense':
                sorted = [...allPokemon].sort((a, b) => {
                    const aDefense = a.stats.find(stat => stat.name === 'defense')?.value || 0;
                    const bDefense = b.stats.find(stat => stat.name === 'defense')?.value || 0;
                    return bDefense - aDefense; // Descending
                });
                break;
            default:
                sorted = [...allPokemon];
        }
        
        displayPokemon(sorted);
    }
    
    // Helper functions to show/hide loader
    function showLoader() {
        pokemonLoader.style.display = 'flex';
    }
    
    function hideLoader() {
        pokemonLoader.style.display = 'none';
    }
    
    // Event listener for sort selection
    sortBy.addEventListener('change', () => {
        sortPokemon(sortBy.value);
    });
    
    // Initial load of Pokémon
    fetchPokemonList();
    
    // Expose functions to global scope for type navigation
    window.pokemonFunctions = {
        filterByType,
        sortPokemon
    };
}); 