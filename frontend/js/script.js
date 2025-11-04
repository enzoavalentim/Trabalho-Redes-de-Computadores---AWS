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

const fetchPokemon = async (pokemon) => {
  const APIResponse = await fetch(`https://pokeapi.co/api/v2/pokemon/${pokemon}`);

  if (APIResponse.status === 200) {
    const data = await APIResponse.json();
    return data;
  }
};

const fetchWeaknesses = async (typeUrl) => {
  const response = await fetch(typeUrl);
  const data = await response.json();
  const weaknesses = data.damage_relations.double_damage_from.map(
    (w) => w.name
  );
  return weaknesses;
};

const renderPokemon = async (pokemon) => {
  pokemonName.innerHTML = 'Loading...';
  pokemonNumber.innerHTML = '';
  pokemonImage.style.display = 'none';

  const data = await fetchPokemon(pokemon);

  if (data) {
    pokemonImage.style.display = 'block';
    pokemonName.innerHTML = data.name;
    pokemonNumber.innerHTML = data.id;
    pokemonImage.src =
      data['sprites']['versions']['generation-v']['black-white']['animated']['front_default'] ||
      data['sprites']['front_default'];

    pokemonType.innerHTML = data.types.map((t) => t.type.name).join(', ');
    pokemonHeight.innerHTML = `${data.height / 10} m`;
    pokemonWeight.innerHTML = `${data.weight / 10} kg`;

    const firstTypeUrl = data.types[0].type.url;
    const weaknesses = await fetchWeaknesses(firstTypeUrl);
    pokemonWeaknesses.innerHTML = weaknesses.join(', ') || 'None';

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

  const typeName = data.types[0].type.name;

  typeIcon.src = `./types/${typeName}.png`;
  typeIcon.alt = typeName;

};

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

renderPokemon(searchPokemon);
