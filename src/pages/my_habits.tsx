import { useSession } from "next-auth/react";
import Head from "next/head";
import { useEffect, useRef, useState } from "react";
import { api } from "~/utils/api";
import { useAutoAnimate } from "@formkit/auto-animate/react";
import { type Habit } from "@prisma/client";

export default function MyHabits() {
  const [newHabit, setNewHabit] = useState("");
  const [selectedHabit, setSelectedHabit] = useState<number>(0);
  const [newName, setNewName] = useState("");
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
    });
  };

  const handleHabitCompleted = (done: boolean, habit: Habit) => {
    updateHabit.mutate({
      id: habit.id,
      name: habit.name,
      lastPerformed: habit.lastPerformed,
      done: done,
    });
  };

  const handleOldData = (lastPerformed: Date, done: boolean, habit: Habit) => {
    updateHabit.mutate({
      id: habit.id,
      name: habit.name,
      lastPerformed: lastPerformed,
      done: done,
    });
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
            </div>
            {habits?.map((habit, index) => {
              return (
                <HabitItem
                  name={habit.name}
                  lastPerformed={habit.lastPerformed}
                  done={habit.done}
                  oldData={(lastPerformed: Date, done: boolean) =>
                    handleOldData(lastPerformed, done, habit)
                  }
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
            <div className="modal-action">
              {/* if there is a button in form, it will close the modal */}
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
  name: string;
  lastPerformed: Date;
  done: boolean;
  oldData: (lastPerformed: Date, done: boolean) => void;
  edit: () => void;
  habitDone: (isDone: boolean) => void;
}

function HabitItem(props: HabitItem) {
  const [checked, setChecked] = useState(props.done);

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

  useEffect(() => {
    if (props.done) {
      const lastPerformed = new Date(props.lastPerformed);
      if (isToday(lastPerformed)) {
        setChecked(true);
      } else if (isYesterday(lastPerformed)) {
        setChecked(false);
        props.oldData(lastPerformed, false);
        console.log(
          "The habit" +
            props.name +
            " was done yesterday, updating its last performed date to today."
        );
      } else {
        setChecked(false);
        props.habitDone(false);
      }
    }
  }, [props]);

  const handleCheckboxClicked = () => {
    props.habitDone(!checked);
    setChecked(!checked);
  };

  return (
    <div className="flex flex-row items-baseline justify-between gap-4 rounded-xl bg-neutral p-4 text-primary-content hover:bg-neutral-focus">
      <h3 className="text-xl font-bold sm:text-[1.5rem]" onClick={props.edit}>
        {props.name}
      </h3>
      <p>{props.lastPerformed.getDay()}</p>
      <input
        type="checkbox"
        defaultChecked={checked}
        onClick={handleCheckboxClicked}
        className="checkbox my-auto"
      />
    </div>
  );
}
