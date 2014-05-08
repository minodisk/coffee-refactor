tmp = [ 0, 1 ]
fib = (i) ->
  return tmp[i] if tmp[i]?
  tmp[i] = fib(i - 1) + fib(i - 2)
for i in [0..10]
  console.log i, fib i
