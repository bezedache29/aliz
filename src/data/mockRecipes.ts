import { Recipe } from '@/src/models/recipe/recipe.model'

export const MOCK_RECIPES: Recipe[] = [
  {
    id: 'mock-recipe-1',
    name: 'Poulet rôti aux légumes',
    category: 'Plat principal',
    servings: 4,
    prepTime: 15,
    cookTime: 40,
    isFavorite: true,
    ingredients: [
      {
        food: {
          id: 'ciqual-mock-poulet',
          name: 'Blanc de poulet cuit',
          source: 'ciqual',
          per100g: { kcal: 165, proteines: 31, glucides: 0, lipides: 3.6 },
        },
        quantityG: 600,
      },
      {
        food: {
          id: 'ciqual-mock-carotte',
          name: 'Carotte crue',
          source: 'ciqual',
          per100g: { kcal: 41, proteines: 0.9, glucides: 9, lipides: 0.2 },
        },
        quantityG: 300,
      },
      {
        food: {
          id: 'ciqual-mock-courgette',
          name: 'Courgette crue',
          source: 'ciqual',
          per100g: { kcal: 17, proteines: 1.2, glucides: 3.1, lipides: 0.3 },
        },
        quantityG: 300,
      },
      {
        food: {
          id: 'ciqual-mock-oignon',
          name: 'Oignon cru',
          source: 'ciqual',
          per100g: { kcal: 40, proteines: 1.1, glucides: 9.3, lipides: 0.1 },
        },
        quantityG: 100,
      },
    ],
    steps: [
      'Préchauffer le four à 200°C.',
      'Couper les légumes en morceaux et les disposer dans un plat allant au four.',
      "Poser le poulet sur les légumes, saler, poivrer et ajouter un filet d'huile d'olive.",
      'Enfourner 40 min en arrosant à mi-cuisson.',
    ],
  },
  {
    id: 'mock-recipe-2',
    name: 'Omelette aux champignons',
    category: 'Entrée',
    servings: 1,
    prepTime: 5,
    cookTime: 10,
    ingredients: [
      {
        food: {
          id: 'ciqual-mock-oeuf',
          name: 'Œuf entier cru',
          source: 'ciqual',
          per100g: { kcal: 143, proteines: 13, glucides: 0.7, lipides: 10 },
        },
        quantityG: 180,
      },
      {
        food: {
          id: 'ciqual-mock-champignon',
          name: 'Champignon de Paris cru',
          source: 'ciqual',
          per100g: { kcal: 22, proteines: 3, glucides: 3, lipides: 0.3 },
        },
        quantityG: 150,
      },
      {
        food: {
          id: 'ciqual-mock-emmental',
          name: 'Emmental râpé',
          source: 'ciqual',
          per100g: { kcal: 382, proteines: 28, glucides: 1.5, lipides: 29 },
        },
        quantityG: 30,
      },
    ],
    steps: [
      "Faire revenir les champignons émincés dans une poêle huilée jusqu'à évaporation de l'eau.",
      'Battre les œufs, saler et poivrer.',
      'Verser les œufs sur les champignons, cuire à feu doux.',
      "Parsemer d'emmental, replier l'omelette et servir.",
    ],
  },
  {
    id: 'mock-recipe-3',
    name: 'Porridge banane miel',
    category: 'Petit-déjeuner',
    servings: 1,
    prepTime: 2,
    cookTime: 5,
    ingredients: [
      {
        food: {
          id: 'ciqual-mock-flocons',
          name: "Flocons d'avoine",
          source: 'ciqual',
          per100g: { kcal: 375, proteines: 13, glucides: 65, lipides: 7 },
        },
        quantityG: 60,
      },
      {
        food: {
          id: 'ciqual-mock-lait',
          name: 'Lait demi-écrémé',
          source: 'ciqual',
          per100g: { kcal: 46, proteines: 3.2, glucides: 4.7, lipides: 1.5 },
        },
        quantityG: 200,
      },
      {
        food: {
          id: 'ciqual-mock-banane',
          name: 'Banane',
          source: 'ciqual',
          per100g: { kcal: 89, proteines: 1.1, glucides: 23, lipides: 0.3 },
        },
        quantityG: 100,
      },
      {
        food: {
          id: 'ciqual-mock-miel',
          name: 'Miel',
          source: 'ciqual',
          per100g: { kcal: 304, proteines: 0.3, glucides: 82, lipides: 0 },
        },
        quantityG: 15,
      },
    ],
    steps: [
      'Verser les flocons et le lait dans une casserole.',
      "Chauffer à feu moyen en remuant jusqu'à obtenir la consistance souhaitée (3-5 min).",
      "Transvaser dans un bol, garnir de rondelles de banane et d'un filet de miel.",
    ],
  },
  {
    id: 'mock-recipe-4',
    name: 'Salade de lentilles aux carottes',
    category: 'Entrée',
    servings: 2,
    prepTime: 10,
    cookTime: 25,
    ingredients: [
      {
        food: {
          id: 'ciqual-mock-lentilles',
          name: 'Lentilles cuites',
          source: 'ciqual',
          per100g: { kcal: 116, proteines: 9, glucides: 20, lipides: 0.4 },
        },
        quantityG: 300,
      },
      {
        food: {
          id: 'ciqual-mock-carotte',
          name: 'Carotte crue',
          source: 'ciqual',
          per100g: { kcal: 41, proteines: 0.9, glucides: 9, lipides: 0.2 },
        },
        quantityG: 150,
      },
      {
        food: {
          id: 'ciqual-mock-tomate-cerise',
          name: 'Tomate cerise',
          source: 'ciqual',
          per100g: { kcal: 18, proteines: 0.9, glucides: 3.9, lipides: 0.2 },
        },
        quantityG: 100,
      },
    ],
    steps: [
      "Cuire les lentilles dans de l'eau salée selon le temps indiqué sur le paquet.",
      'Râper les carottes, couper les tomates cerises en deux.',
      'Mélanger les lentilles refroidies avec les légumes.',
      'Assaisonner avec vinaigrette moutarde, sel et poivre.',
    ],
  },
]
