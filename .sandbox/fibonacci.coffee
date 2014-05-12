tmp = [ 0, 1 ]
fibonacci = (i) ->
  return tmp[i] if tmp[i]?
  tmp[i] = fibonacci(i - 1) + fibonacci(i - 2)
for i in [0..10]
  console.log i, fibonacci i
