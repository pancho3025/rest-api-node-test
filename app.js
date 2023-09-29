const express = require("express");
const moviesJSON = require("./movies.json");
const crypto = require("node:crypto");
const cors = require('cors')
const { validateMovie, validatePartialMovie } = require("./schemas/movies");

const app = express();

app.use(express.json());
app.use(cors({
  origin:(origin,callback)=>{
    const ACCEPTED_ORIGINS = [
      "http://localhost:8080",
      "http://localhost:1234",
      "http://movies.com",
      "http://midu.dev",
    ];
    if(ACCEPTED_ORIGINS.includes(origin)){
      return callback(null,true)
    }
    if(!origin){
      return callback(null, true)
    }
    return callback(new Error('Not Allowed by CORS'))
  }}
))
app.disable("x-powered-by");




app.delete('/movies/:id', (req, res) => {
 
  const { id } = req.params
  const movieIndex = moviesJSON.findIndex(movie => movie.id === id)

  if (movieIndex === -1) {
    return res.status(404).json({ message: 'Movie not found' })
  }

  moviesJSON.splice(movieIndex, 1)

  return res.json({ message: 'Movie deleted' })
})

//Todos los recursos que sean MOVIES se identifican con /movies
app.get("/movies", (req, res) => {
 

  const { genre } = req.query;
  if (genre) {
    const filteredMovies = moviesJSON.filter((movie) =>
      movie.genre.some((g) => g.toLowerCase() === genre.toLowerCase())
    );
    return res.json(filteredMovies);
  }
  res.json(moviesJSON);
});

app.get("/movies/:id", (req, res) => {
  const { id } = req.params;
  const movie = moviesJSON.find((movie) => movie.id === id);
  if (movie) return res.json(movie);

  res.status(404).json({ message: "Movie not found" });
});

app.post("/movies", (req, res) => {
  const result = validateMovie(req.body);

  if (result.error) {
    return res.status(400).json({ error: JSON.parse(result.error.message) });
  }

  const newMovie = {
    id: crypto.randomUUID(),
    ...result.data,
  };

  //Esto no seria REST, porque estamos guardano el estado de la aplicacion en memoria.
  moviesJSON.push(newMovie);

  res.status(201).json(newMovie);
});

app.patch("/movies/:id", (req, res) => {
  const result = validatePartialMovie(req.body);

  if (!result.success) {
    return res.status(400).json({ error: JSON.parse(result.error.message) });
  }

  const { id } = req.params;
  const movieIndex = moviesJSON.findIndex((movie) => movie.id === id);

  if (movieIndex < 0) {
    return res.status(404).json({ message: "Movie not found" });
  }

  const updateMovie = {
    ...moviesJSON[movieIndex],
    ...result.data,
  };

  moviesJSON[movieIndex] = updateMovie;

  return res.json(updateMovie);
});



const PORT = process.env.PORT ?? 1234;

app.listen(PORT, () => {
  console.log(`servidor escuchando en el puerto ${PORT}`);
});
