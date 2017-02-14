package helper

import "time"

type job struct {
	duration time.Duration
	handler  func()
}

type Timer struct {
	jobs      []job
	isStarted bool
}

func (t *Timer) Add(dura time.Duration, handler func()) {
	if t.isStarted {
		panic("Already Started")
	}
	j := job{dura, handler}
	t.jobs = append(t.jobs, j)
}

func (t *Timer) Start() {
	if t.isStarted {
		return
	}

	t.isStarted = true
	for _, j := range t.jobs {
		c := time.Tick(j.duration)
		go func(c <-chan time.Time, handler func()) {
			for _ = range c {
				handler()
			}
		}(c, j.handler)
	}
}
