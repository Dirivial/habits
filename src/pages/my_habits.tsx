import { useSession } from "next-auth/react";
import Head from "next/head";
import { useEffect, useRef, useState } from "react";
import { api } from "~/utils/api";
import { useAutoAnimate } from "@formkit/auto-animate/react";
import { type Habit } from "@prisma/client";
import { themeChange } from "theme-change";

export default function MyHabits() {
  const [newHabit, setNewHabit] = useState("");
  const [selectedHabit, setSelectedHabit] = useState<number>(0);
  const [newName, setNewName] = useState("");
  const [newGoal, setNewGoal] = useState(0);
  const [parent] = useAutoAnimate();
  const myModal = useRef<HTMLDialogElement>(null);

  const { data: sessionData } = useSession();
  const { data: habits, refetch: refetchHabits } =
    api.habit.getUserHabits.useQuery(undefined, {
      enabled: sessionData?.user !== undefined,
    });

  const createHabit = api.habit.create.useMutation({
    onSuccess: () => refetchHabits(),
  });

  const updateHabit = api.habit.update.useMutation({
    onSuccess: () => refetchHabits(),
  });

  const deleteHabit = api.habit.delete.useMutation({
    onSuccess: () => refetchHabits(),
  });

  useEffect(() => {
    themeChange(false);
  }, []);

  const isToday = (date: Date) => {
    const today = new Date();
    return (
      date.getFullYear() === today.getFullYear() &&
      date.getMonth() === today.getMonth() &&
      date.getDate() === today.getDate()
    );
  };

  const isYesterday = (date: Date) => {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    return (
      date.getFullYear() === yesterday.getFullYear() &&
      date.getMonth() === yesterday.getMonth() &&
      date.getDate() === yesterday.getDate()
    );
  };

  const handleCreateHabit = () => {
    if (newHabit.trim().length > 0) {
      createHabit.mutate({ name: newHabit });
      setNewHabit("");
    }
  };

  const handleHabitEdit = (habitId: number) => {
    setSelectedHabit(habitId);
    setNewName(habits?.at(habitId)?.name ?? "");
    setNewGoal(habits?.at(habitId)?.goal ?? 0);
    myModal.current?.showModal();
  };

  const handleHabitEdited = () => {
    updateHabit.mutate({
      id: habits?.at(selectedHabit)?.id ?? "",
      name: newName,
      lastPerformed: habits?.at(selectedHabit)?.lastPerformed ?? new Date(),
      done: habits?.at(selectedHabit)?.done ?? false,
      streak: habits?.at(selectedHabit)?.streak ?? 0,
      goal: newGoal,
    });
  };

  const handleHabitCompleted = (done: boolean, habit: Habit) => {
    if (done) {
      const streak =
        isToday(habit.lastPerformed) || isYesterday(habit.lastPerformed)
          ? habit.streak + 1
          : 1;

      updateHabit.mutate({
        id: habit.id,
        name: habit.name,
        lastPerformed: new Date(),
        done: done,
        streak: streak,
        goal: habit.goal,
      });
    } else {
      const streak =
        isToday(habit.lastPerformed) || isYesterday(habit.lastPerformed)
          ? habit.streak - 1
          : 0;
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);

      updateHabit.mutate({
        id: habit.id,
        name: habit.name,
        lastPerformed: yesterday,
        done: done,
        streak: streak,
        goal: habit.goal,
      });
    }
  };

  const resetStreak = () => {
    const habit = habits?.at(selectedHabit);
    if (habit) {
      updateHabit.mutate({
        id: habit.id,
        name: habit.name,
        lastPerformed: habit.lastPerformed,
        done: habit.done,
        streak: 0,
        goal: habit.goal,
      });
    }
  };

  const handleDeleteHabit = () => {
    const habit = habits?.at(selectedHabit);
    if (habit) {
      deleteHabit.mutate({ id: habit.id });
    }
    myModal.current?.close();
  };

  return (
    <>
      <Head>
        <title>My Habits</title>
        <meta name="description" content="Small habit tracker application." />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <main className="flex min-h-screen flex-col items-center bg-gradient-to-b from-base-100 to-base-300">
        <div className="container flex flex-col items-center justify-center gap-12 px-4 py-16">
          <h1 className="text-5xl font-extrabold tracking-tight text-primary-content sm:text-[5rem]">
            My <span className="text-primary">Habits</span>
          </h1>

          <div ref={parent} className="grid w-full grid-cols-1 gap-4 md:gap-8">
            <div className="grid w-full grid-cols-3 gap-x-2">
              <div></div>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="New Habit"
                  className="input flex-grow"
                  value={newHabit}
                  onChange={(e) => setNewHabit(e.target.value)}
                />
                <button className="btn btn-primary" onClick={handleCreateHabit}>
                  Add
                </button>
              </div>
              <div className="flex justify-end px-2">
                <div className="dropdown dropdown-end">
                  <label tabIndex={0} className="btn my-2">
                    Theme
                  </label>
                  <ul
                    tabIndex={0}
                    className="menu dropdown-content rounded-box z-[1] my-1.5 w-52 bg-base-200 p-2 shadow"
                  >
                    <li>
                      <a data-set-theme="light">Light</a>
                    </li>
                    <li>
                      <a data-set-theme="dark">Dark</a>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
            {habits?.map((habit, index) => {
              return (
                <HabitItem
                  habit={habit}
                  name={habit.name}
                  lastPerformed={habit.lastPerformed}
                  done={habit.done}
                  edit={() => handleHabitEdit(index)}
                  habitDone={(isDone: boolean) =>
                    handleHabitCompleted(isDone, habit)
                  }
                  key={index}
                />
              );
            })}
          </div>
        </div>

        <dialog ref={myModal} id="habit_modal" className="modal">
          <form method="dialog" className="modal-box">
            <h3 className="text-lg font-bold">Edit Habit</h3>
            <div>
              <label className="label">Name</label>
              <input
                type="text"
                placeholder={habits?.at(selectedHabit)?.name}
                className="input w-full"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
              />
            </div>

            <div className="dropdown dropdown-right">
              <label tabIndex={0} className="btn my-2">
                Current Streak: {habits?.at(selectedHabit)?.streak}
              </label>
              <ul
                tabIndex={0}
                className="menu dropdown-content rounded-box z-[1] my-1.5 w-52 bg-base-200 p-2 shadow"
              >
                <li>
                  <a onClick={resetStreak}>Reset Streak</a>
                </li>
              </ul>
            </div>

            <div>
              <label className="label">Goal</label>
              <input
                type="number"
                placeholder={"Set a streak goal"}
                className="input w-full"
                value={newGoal}
                onChange={(e) => setNewGoal(Number(e.target.value))}
              />
            </div>

            <div className="modal-action flex justify-between">
              {/* if there is a button in form, it will close the modal */}
              <a
                onClick={handleDeleteHabit}
                className="btn btn-warning text-warning-content"
              >
                Delete
              </a>
              <button onClick={handleHabitEdited} className="btn">
                Close
              </button>
            </div>
          </form>
        </dialog>
      </main>
    </>
  );
}

interface HabitItem {
  habit: Habit;
  name: string;
  lastPerformed: Date;
  done: boolean;
  edit: () => void;
  habitDone: (isDone: boolean) => void;
}

function HabitItem(props: HabitItem) {
  const [checked, setChecked] = useState(
    props.done && isToday(props.lastPerformed)
  );

  const [streak, setStreak] = useState(
    isToday(props.lastPerformed) || isYesterday(props.lastPerformed)
      ? props.habit.streak
      : 0
  );

  const handleCheckboxClicked = () => {
    props.habitDone(!checked);
    setChecked(!checked);
    if (checked) {
      setStreak(streak + 1);
    } else {
      setStreak(streak - 1);
    }
  };

  function isToday(date: Date) {
    const today = new Date();
    return (
      date.getFullYear() === today.getFullYear() &&
      date.getMonth() === today.getMonth() &&
      date.getDate() === today.getDate()
    );
  }

  function isYesterday(date: Date) {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    return (
      date.getFullYear() === yesterday.getFullYear() &&
      date.getMonth() === yesterday.getMonth() &&
      date.getDate() === yesterday.getDate()
    );
  }

  return (
    <div className="flex gap-1 rounded-xl bg-base-300 p-1 transition-colors hover:bg-primary hover:shadow-md">
      <div
        onClick={props.edit}
        className="flex flex-grow cursor-pointer flex-row items-baseline justify-between gap-4 rounded-lg bg-base-300 p-4 text-base-content"
      >
        <h3 className="text-xl font-bold sm:text-[1.5rem]">{props.name}</h3>
        <p>{props.lastPerformed.getDate()}</p>
      </div>
      <div
        className="grid cursor-pointer rounded-lg bg-base-300 px-4 py-2"
        onClick={handleCheckboxClicked}
      >
        <input
          type="checkbox"
          defaultChecked={checked}
          onClick={handleCheckboxClicked}
          className="checkbox my-auto"
          checked={checked}
        />
      </div>
    </div>
  );
}
