const pokemonName = document.querySelector('.pokemon__name');
const pokemonNumber = document.querySelector('.pokemon__number');
const pokemonImage = document.querySelector('.pokemon__image');
const typeIcon = document.querySelector('.type-icon');

const pokemonType = document.querySelector('.pokemon__type');
const pokemonHeight = document.querySelector('.pokemon__height');
const pokemonWeight = document.querySelector('.pokemon__weight');
const pokemonWeaknesses = document.querySelector('.pokemon__weaknesses');

const form = document.querySelector('.form');
const input = document.querySelector('.input__search');
const buttonPrev = document.querySelector('.btn-prev');
const buttonNext = document.querySelector('.btn-next');

let searchPokemon = 1;

// ðŸŸ¢ URLs das APIs
const READ_API = "https://u9qdyf01qk.execute-api.us-east-1.amazonaws.com/pokemon-db"; // Lambda de leitura
const WRITE_API = "https://u9qdyf01qk.execute-api.us-east-1.amazonaws.com/pokemon";    // Lambda de escrita

// ðŸ”¹ Busca PokÃ©mon no banco via API de leitura
const fetchPokemonFromDB = async (pokemon) => {
  const url = isNaN(pokemon)
    ? `${READ_API}?name=${pokemon}`
    : `${READ_API}?id=${pokemon}`;
  const response = await fetch(url);
  if (response.status === 200) {
    const data = await response.json();
    return data[0];
  }
  return null;
};

// ðŸ”¹ Caso o PokÃ©mon nÃ£o exista no banco, chama a Lambda de escrita
const fetchAndSavePokemon = async (pokemon) => {
  const url = `${WRITE_API}?name=${pokemon}`;
  const response = await fetch(url);
  if (response.status === 200) {
    const data = await response.json();
    return data.data;
  }
  return null;
};

// ðŸ”¹ Renderiza os dados do PokÃ©mon
const renderPokemon = async (pokemon) => {
  pokemonName.innerHTML = 'Loading...';
  pokemonNumber.innerHTML = '';
  pokemonImage.style.display = 'none';

  // 1ï¸âƒ£ tenta buscar do RDS
  let data = await fetchPokemonFromDB(pokemon);

  // 2ï¸âƒ£ se nÃ£o encontrar, busca da PokÃ©API via Lambda de escrita
  if (!data) {
    await fetchAndSavePokemon(pokemon);

    // ðŸ” aguarda 1 segundo e tenta buscar novamente no RDS
    await new Promise((resolve) => setTimeout(resolve, 1000));
    data = await fetchPokemonFromDB(pokemon);
  }

  // 3ï¸âƒ£ exibe ou mostra erro
  if (data) {
    pokemonImage.style.display = 'block';
    pokemonName.innerHTML = data.name;
    pokemonNumber.innerHTML = data.id;
    pokemonImage.src = data.sprite || './images/placeholder.png';
    pokemonType.innerHTML = (Array.isArray(data.types) ? data.types.join(', ') : data.types) || '-';
    pokemonHeight.innerHTML = data.height;
    pokemonWeight.innerHTML = data.weight;
    pokemonWeaknesses.innerHTML =
      data.weaknesses && data.weaknesses.length ? data.weaknesses.join(', ') : '-';

    const mainType = Array.isArray(data.types) ? data.types[0] : (data.types || '').split(',')[0];
    typeIcon.src = `./types/${mainType.trim()}.png`;
    typeIcon.alt = mainType.trim();

    input.value = '';
    searchPokemon = data.id;
  } else {
    pokemonImage.style.display = 'none';
    pokemonName.innerHTML = 'Not found :c';
    pokemonNumber.innerHTML = '';
    pokemonType.innerHTML = '-';
    pokemonHeight.innerHTML = '-';
    pokemonWeight.innerHTML = '-';
    pokemonWeaknesses.innerHTML = '-';
  }
};


// ðŸ”¹ Eventos
form.addEventListener('submit', (event) => {
  event.preventDefault();
  renderPokemon(input.value.toLowerCase());
});

buttonPrev.addEventListener('click', () => {
  if (searchPokemon > 1) {
    searchPokemon -= 1;
    renderPokemon(searchPokemon);
  }
});

buttonNext.addEventListener('click', () => {
  searchPokemon += 1;
  renderPokemon(searchPokemon);
});

// ðŸ”¹ Inicializa com o primeiro PokÃ©mon
renderPokemon(searchPokemon);
