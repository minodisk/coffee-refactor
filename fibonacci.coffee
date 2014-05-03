cache = [ 0, 1 ]
fibonacci = (n) ->
  return cache[n] if cache[n]?
  cache[n] = fibonacci(n - 1) + fibonacci(n - 2)
for i in [0..10]
  console.log i, fibonacci i
