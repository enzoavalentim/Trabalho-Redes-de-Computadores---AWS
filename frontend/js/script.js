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
  const APIResponse = await fetch(`https://u9qdyf01qk.execute-api.us-east-1.amazonaws.com/pokemon?name=${pokemon}`);


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

  // usa a imagem normalizada
  pokemonImage.src = data.sprite || './images/placeholder.png';

  // usa os campos simplificados da Lambda
  pokemonType.innerHTML = data.types.join(', ');
  pokemonHeight.innerHTML = data.height;
  pokemonWeight.innerHTML = data.weight;
  pokemonWeaknesses.innerHTML = (data.weaknesses && data.weaknesses.length)
  ? data.weaknesses.join(', ')
  : '-'; // por enquanto, a Lambda não retorna fraquezas

  // atualiza o ícone do tipo principal
  const mainType = data.types[0];
  typeIcon.src = `./types/${mainType}.png`;
  typeIcon.alt = mainType;

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
