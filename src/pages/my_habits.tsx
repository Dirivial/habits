import { useSession } from "next-auth/react";
import Head from "next/head";
import { useRef, useState } from "react";
import { api } from "~/utils/api";
import { useAutoAnimate } from "@formkit/auto-animate/react";
import { type Habit } from "@prisma/client";

export default function MyHabits() {
  const [newHabit, setNewHabit] = useState("");
  const [selectedHabit, setSelectedHabit] = useState<number>(0);
  const [newName, setNewName] = useState("");
  const [parent] = useAutoAnimate();
  const [darkTheme, setDarkTheme] = useState(true);
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
    myModal.current?.showModal();
  };

  const handleHabitEdited = () => {
    updateHabit.mutate({
      id: habits?.at(selectedHabit)?.id ?? "",
      name: newName,
      lastPerformed: habits?.at(selectedHabit)?.lastPerformed ?? new Date(),
      done: habits?.at(selectedHabit)?.done ?? false,
      streak: habits?.at(selectedHabit)?.streak ?? 0,
      goal: habits?.at(selectedHabit)?.goal ?? 0,
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
  };

  const handleThemeChange = () => {
    console.log("Changed darktheme to ", !darkTheme);
    setDarkTheme(!darkTheme);
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
            <div className="flex justify-center gap-x-4">
              <input
                type="text"
                placeholder="New Habit"
                className="input"
                value={newHabit}
                onChange={(e) => setNewHabit(e.target.value)}
              />
              <button className="btn btn-primary" onClick={handleCreateHabit}>
                Add
              </button>

              <label className="swap-rotate swap">
                {/* this hidden checkbox controls the state */}
                <input
                  type="checkbox"
                  value={darkTheme ? "checked" : "unchecked"}
                  onChange={handleThemeChange}
                />

                {/* sun icon */}
                <svg
                  className="swap-on h-10 w-10 fill-current"
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                >
                  <path d="M5.64,17l-.71.71a1,1,0,0,0,0,1.41,1,1,0,0,0,1.41,0l.71-.71A1,1,0,0,0,5.64,17ZM5,12a1,1,0,0,0-1-1H3a1,1,0,0,0,0,2H4A1,1,0,0,0,5,12Zm7-7a1,1,0,0,0,1-1V3a1,1,0,0,0-2,0V4A1,1,0,0,0,12,5ZM5.64,7.05a1,1,0,0,0,.7.29,1,1,0,0,0,.71-.29,1,1,0,0,0,0-1.41l-.71-.71A1,1,0,0,0,4.93,6.34Zm12,.29a1,1,0,0,0,.7-.29l.71-.71a1,1,0,1,0-1.41-1.41L17,5.64a1,1,0,0,0,0,1.41A1,1,0,0,0,17.66,7.34ZM21,11H20a1,1,0,0,0,0,2h1a1,1,0,0,0,0-2Zm-9,8a1,1,0,0,0-1,1v1a1,1,0,0,0,2,0V20A1,1,0,0,0,12,19ZM18.36,17A1,1,0,0,0,17,18.36l.71.71a1,1,0,0,0,1.41,0,1,1,0,0,0,0-1.41ZM12,6.5A5.5,5.5,0,1,0,17.5,12,5.51,5.51,0,0,0,12,6.5Zm0,9A3.5,3.5,0,1,1,15.5,12,3.5,3.5,0,0,1,12,15.5Z" />
                </svg>

                {/* moon icon */}
                <svg
                  className="swap-off h-10 w-10 fill-current"
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                >
                  <path d="M21.64,13a1,1,0,0,0-1.05-.14,8.05,8.05,0,0,1-3.37.73A8.15,8.15,0,0,1,9.08,5.49a8.59,8.59,0,0,1,.25-2A1,1,0,0,0,8,2.36,10.14,10.14,0,1,0,22,14.05,1,1,0,0,0,21.64,13Zm-9.5,6.69A8.14,8.14,0,0,1,7.08,5.22v.27A10.15,10.15,0,0,0,17.22,15.63a9.79,9.79,0,0,0,2.1-.22A8.11,8.11,0,0,1,12.14,19.73Z" />
                </svg>
              </label>
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
            <input
              type="text"
              placeholder={habits?.at(selectedHabit)?.name}
              className="input w-full"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
            />
            <details className="dropdown dropdown-right">
              <summary className="btn my-2">
                Streak: {habits?.at(selectedHabit)?.streak}
              </summary>
              <ul className="menu dropdown-content rounded-box z-[1] my-1.5 w-52 bg-base-200 p-2 shadow">
                <li>
                  <a onClick={resetStreak}>Reset Streak</a>
                </li>
              </ul>
            </details>

            <div className="modal-action flex justify-between">
              {/* if there is a button in form, it will close the modal */}
              <button onClick={handleDeleteHabit} className="btn btn-warning">
                Delete
              </button>
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
    <div className="flex flex-row items-baseline justify-between gap-4 rounded-xl bg-neutral p-4 text-primary-content hover:bg-neutral-focus">
      <h3 className="text-xl font-bold sm:text-[1.5rem]" onClick={props.edit}>
        {props.name}
      </h3>
      <p>{props.lastPerformed.getDate()}</p>
      <input
        type="checkbox"
        defaultChecked={checked}
        onClick={handleCheckboxClicked}
        className="checkbox my-auto"
      />
    </div>
  );
}
